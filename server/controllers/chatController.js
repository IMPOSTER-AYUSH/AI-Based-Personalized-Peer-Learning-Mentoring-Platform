const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      deletedFor: { $ne: req.user._id },
    })
      .populate('participants', 'name avatar bio skillsTeaching skillsLearning lastActive experienceLevel')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name avatar' },
      })
      .sort('-lastMessageAt');

    res.json({ conversations });
  } catch (error) {
    next(error);
  }
};

exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot start conversation with yourself' });
    }

    const sortedParticipants = [req.user._id.toString(), userId.toString()].sort();

    let conversation = await Conversation.findOne({
      participants: { $all: sortedParticipants, $size: 2 },
    })
      .populate('participants', 'name avatar bio skillsTeaching skillsLearning lastActive experienceLevel')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name avatar' },
      });

    if (conversation) {
      // If the conversation was previously deleted/hidden by the current user, restore it for them
      if (conversation.deletedFor && conversation.deletedFor.some((id) => id.toString() === req.user._id.toString())) {
        conversation.deletedFor = conversation.deletedFor.filter((id) => id.toString() !== req.user._id.toString());
        await conversation.save();
      }
    } else {
      conversation = await Conversation.create({
        participants: sortedParticipants,
        deletedFor: [],
      });
      conversation = await conversation.populate(
        'participants',
        'name avatar bio skillsTeaching skillsLearning lastActive experienceLevel'
      );
    }

    res.json({ conversation });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Authorize: Ensure user is a participant of this conversation
    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });
    if (!conv) {
      return res.status(403).json({ message: 'Not authorized to view messages in this conversation' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name avatar')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ messages: messages.reverse() });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content, type, fileUrl, fileName } = req.body;

    // Authorize: Ensure user is a participant of this conversation
    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });
    if (!conv) {
      return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content: content || '',
      type: type || 'text',
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      readBy: [req.user._id],
    });

    conv.lastMessage = message._id;
    conv.lastMessageAt = new Date();

    // Restore conversation if it was deleted/hidden by any participant
    if (conv.deletedFor && conv.deletedFor.length > 0) {
      conv.deletedFor = [];
    }

    // Increment unread for other participants
    for (const participant of conv.participants) {
      const pIdStr = participant.toString();
      if (pIdStr !== req.user._id.toString()) {
        const count = conv.unreadCount.get(pIdStr) || 0;
        conv.unreadCount.set(pIdStr, count + 1);
      }
    }
    await conv.save();

    const populated = await message.populate('sender', 'name avatar');

    // Real-time broadcasting via Socket.IO
    try {
      const io = getIO();
      // Emit to active conversation room
      io.to(`chat:${conversationId}`).emit('chat:message', populated);

      // Emit conversation update and notification to other participants
      for (const participant of conv.participants) {
        const pIdStr = participant.toString();
        if (pIdStr !== req.user._id.toString()) {
          io.to(`user:${pIdStr}`).emit('chat:conversation_updated', {
            conversationId,
            message: populated,
          });

          // Create persistent notification for new message
          const msgSnippet = content
            ? (content.length > 50 ? content.substring(0, 47) + '...' : content)
            : 'Shared an attachment';

          const notification = await Notification.create({
            recipient: pIdStr,
            sender: req.user._id,
            type: 'new_message',
            title: `Message from ${req.user.name || 'Peer'}`,
            message: msgSnippet,
            link: `/chat?conversationId=${conversationId}`,
          });

          const populatedNotif = await notification.populate('sender', 'name avatar');
          io.to(`user:${pIdStr}`).emit('notification:new', populatedNotif);
        }
      }
    } catch (socketErr) {
      console.warn('Socket emit warning in sendMessage:', socketErr.message);
    }

    res.status(201).json({ message: populated });
  } catch (error) {
    next(error);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    // Authorize: Ensure user is a participant of this conversation
    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });
    if (!conv) {
      return res.status(403).json({ message: 'Not authorized to update this conversation' });
    }

    await Message.updateMany(
      { conversation: conversationId, readBy: { $ne: req.user._id } },
      { $push: { readBy: req.user._id } }
    );

    conv.unreadCount.set(req.user._id.toString(), 0);
    await conv.save();

    try {
      const io = getIO();
      io.to(`chat:${conversationId}`).emit('chat:read', {
        conversationId,
        userId: req.user._id.toString(),
      });
    } catch (socketErr) {
      // ignore
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.deleteConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or not authorized' });
    }

    // Per-user soft deletion: add user ID to deletedFor
    if (!conversation.deletedFor) {
      conversation.deletedFor = [];
    }

    const userIdStr = req.user._id.toString();
    if (!conversation.deletedFor.some((id) => id.toString() === userIdStr)) {
      conversation.deletedFor.push(req.user._id);
      await conversation.save();
    }

    // Synchronize other active tabs of the same account in real-time
    try {
      const io = getIO();
      io.to(`user:${userIdStr}`).emit('chat:conversation_deleted', {
        conversationId,
      });
    } catch (socketErr) {
      // ignore
    }

    res.json({ message: 'Conversation removed successfully', conversationId });
  } catch (error) {
    next(error);
  }
};

