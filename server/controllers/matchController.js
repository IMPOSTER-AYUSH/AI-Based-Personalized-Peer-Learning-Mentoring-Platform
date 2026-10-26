const User = require('../models/User');
const Connection = require('../models/Connection');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');
const { getMatchScore } = require('../utils/ai');
const { getIO } = require('../config/socket');

exports.getMatches = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const { skill, level, search } = req.query;

    const filter = {
      _id: { $ne: currentUser._id },
    };
    if (level) filter.experienceLevel = level;
    if (skill) {
      filter.$or = [
        { skillsTeaching: { $regex: skill, $options: 'i' } },
        { skillsLearning: { $regex: skill, $options: 'i' } },
      ];
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { skillsTeaching: { $regex: search, $options: 'i' } },
        { skillsLearning: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('name avatar bio skillsTeaching skillsLearning experienceLevel rating reviewCount xp level profileCompleted')
      .limit(50);

    // Get all existing connections involving currentUser
    const connections = await Connection.find({
      $or: [{ requester: currentUser._id }, { recipient: currentUser._id }],
    });

    const connectionMap = new Map();
    connections.forEach((c) => {
      const isRequester = c.requester.toString() === currentUser._id.toString();
      const otherId = isRequester ? c.recipient.toString() : c.requester.toString();
      connectionMap.set(otherId, {
        connectionId: c._id,
        status: c.status,
        isRequester,
      });
    });

    const matchPromises = users.map(async (user) => {
      const connInfo = connectionMap.get(user._id.toString()) || null;
      let connectionStatus = 'none';
      let connectionId = null;

      if (connInfo) {
        connectionId = connInfo.connectionId;
        if (connInfo.status === 'accepted') {
          connectionStatus = 'accepted';
        } else if (connInfo.status === 'pending') {
          connectionStatus = connInfo.isRequester ? 'pending_sent' : 'pending_received';
        } else if (connInfo.status === 'rejected') {
          connectionStatus = 'rejected';
        }
      }

      let score = 80;
      let reason = 'Fellow learner ready to explore skill exchange on Connect Skill.';
      try {
        const aiRes = await getMatchScore(currentUser, user);
        if (aiRes) {
          score = aiRes.score || 80;
          reason = aiRes.reason || reason;
        }
      } catch (err) {
        // AI fallback
      }

      return {
        user,
        matchScore: score,
        aiReason: reason,
        connectionStatus,
        connectionId,
      };
    });

    const matches = (await Promise.all(matchPromises)).sort((a, b) => b.matchScore - a.matchScore);

    res.json({ matches });
  } catch (error) {
    next(error);
  }
};

exports.sendRequest = async (req, res, next) => {
  try {
    const { recipientId, matchScore, aiReason } = req.body;
    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    if (recipientId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    const existing = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: recipientId },
        { requester: recipientId, recipient: req.user._id },
      ],
    });
    if (existing) {
      if (existing.status === 'pending') {
        return res.status(400).json({ message: 'Connection request is already pending' });
      } else if (existing.status === 'accepted') {
        return res.status(400).json({ message: 'You are already connected with this user' });
      }
      return res.status(400).json({ message: 'Connection already exists' });
    }

    const connection = await Connection.create({
      requester: req.user._id,
      recipient: recipientId,
      matchScore: matchScore || 0,
      aiReason: aiReason || '',
      skillsToExchange: {
        requesterTeaches: req.user.skillsTeaching || [],
        recipientTeaches: [],
      },
    });

    const notification = await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: 'match_request',
      title: 'New Connection Request',
      message: `${req.user.name || 'A user'} sent you a connection request for skill exchange!`,
      link: '/matches',
    });

    const populatedNotif = await notification.populate('sender', 'name avatar');

    // Real-time notification and connection request via Socket.IO
    try {
      const io = getIO();
      io.to(`user:${recipientId}`).emit('notification:new', populatedNotif);
      io.to(`user:${recipientId}`).emit('connection:incoming_request', {
        connection,
        requester: {
          _id: req.user._id,
          name: req.user.name,
          avatar: req.user.avatar,
          bio: req.user.bio,
          skillsTeaching: req.user.skillsTeaching,
          skillsLearning: req.user.skillsLearning,
          experienceLevel: req.user.experienceLevel,
          rating: req.user.rating,
        },
      });
    } catch (socketErr) {
      console.warn('Socket emit warning in sendRequest:', socketErr.message);
    }

    res.status(201).json({ connection });
  } catch (error) {
    next(error);
  }
};

exports.respondToRequest = async (req, res, next) => {
  try {
    const { connectionId, status } = req.body;
    if (!connectionId || !status) {
      return res.status(400).json({ message: 'Connection ID and status are required' });
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) return res.status(404).json({ message: 'Connection not found' });
    if (connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Connection request has already been resolved' });
    }

    connection.status = status;
    if (status === 'accepted') {
      connection.skillsToExchange.recipientTeaches = req.user.skillsTeaching || [];
    }
    await connection.save();

    // If accepted, ensure a shared conversation is ready for messaging
    let conversation = null;
    if (status === 'accepted') {
      const sortedParticipants = [connection.requester.toString(), connection.recipient.toString()].sort();
      conversation = await Conversation.findOne({
        participants: { $all: sortedParticipants, $size: 2 },
      });
      if (!conversation) {
        conversation = await Conversation.create({
          participants: sortedParticipants,
        });
      }
    }

    const notifType = status === 'accepted' ? 'match_accepted' : 'match_rejected';
    const notification = await Notification.create({
      recipient: connection.requester,
      sender: req.user._id,
      type: notifType,
      title: status === 'accepted' ? 'Connection Accepted!' : 'Connection Declined',
      message: status === 'accepted'
        ? `${req.user.name || 'Your peer'} accepted your connection request! You can now start chatting.`
        : `${req.user.name || 'A user'} declined your connection request.`,
      link: status === 'accepted' ? `/chat?userId=${req.user._id}` : '/matches',
    });

    const populatedNotif = await notification.populate('sender', 'name avatar');

    // Real-time socket events to both participants
    try {
      const io = getIO();
      const requesterIdStr = connection.requester.toString();
      const recipientIdStr = connection.recipient.toString();

      io.to(`user:${requesterIdStr}`).emit('notification:new', populatedNotif);
      io.to(`user:${requesterIdStr}`).emit('connection:status_updated', {
        connectionId: connection._id,
        status,
        partnerId: recipientIdStr,
        conversationId: conversation?._id,
      });
      io.to(`user:${recipientIdStr}`).emit('connection:status_updated', {
        connectionId: connection._id,
        status,
        partnerId: requesterIdStr,
        conversationId: conversation?._id,
      });
    } catch (socketErr) {
      console.warn('Socket emit warning in respondToRequest:', socketErr.message);
    }

    res.json({ connection, conversationId: conversation?._id });
  } catch (error) {
    next(error);
  }
};

exports.getConnections = async (req, res, next) => {
  try {
    const connections = await Connection.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: 'accepted',
    })
      .populate('requester', 'name avatar bio skillsTeaching skillsLearning experienceLevel')
      .populate('recipient', 'name avatar bio skillsTeaching skillsLearning experienceLevel')
      .sort('-createdAt');

    res.json({ connections });
  } catch (error) {
    next(error);
  }
};

exports.getPendingRequests = async (req, res, next) => {
  try {
    const requests = await Connection.find({
      recipient: req.user._id,
      status: 'pending',
    })
      .populate('requester', 'name avatar bio skillsTeaching skillsLearning experienceLevel rating')
      .sort('-createdAt');

    res.json({ requests });
  } catch (error) {
    next(error);
  }
};
