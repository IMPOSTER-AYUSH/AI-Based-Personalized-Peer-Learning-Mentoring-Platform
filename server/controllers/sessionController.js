const Session = require('../models/Session');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const crypto = require('crypto');

exports.createSession = async (req, res, next) => {
  try {
    const { participantId, skill, title, description, date, startTime, endTime, duration, spCost } = req.body;
    
    const cost = spCost || 10;
    const participant = await User.findById(participantId);
    if (!participant) return res.status(404).json({ message: 'User not found' });

    // Check SP balance
    if (req.user.skillPoints < cost) {
      return res.status(400).json({ message: 'Insufficient Skill Points' });
    }

    const session = await Session.create({
      host: req.body.hostId || participantId,
      participant: req.user._id,
      skill,
      title,
      description,
      date,
      startTime,
      endTime,
      duration: duration || 60,
      spCost: cost,
      roomId: crypto.randomBytes(8).toString('hex'),
    });

    // Deduct SP
    req.user.skillPoints -= cost;
    await req.user.save();

    await Transaction.create({
      user: req.user._id,
      type: 'spent',
      amount: cost,
      description: `Booked session: ${title}`,
      relatedSession: session._id,
      relatedUser: participantId,
      balance: req.user.skillPoints,
    });

    await Notification.create({
      recipient: participantId,
      sender: req.user._id,
      type: 'session_request',
      title: 'New Session Request',
      message: `${req.user.name} wants to book a ${skill} session with you.`,
      link: '/calendar',
    });

    const populated = await session.populate([
      { path: 'host', select: 'name avatar' },
      { path: 'participant', select: 'name avatar' },
    ]);
    res.status(201).json({ session: populated });
  } catch (error) {
    next(error);
  }
};

exports.getSessions = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {
      $or: [{ host: req.user._id }, { participant: req.user._id }],
    };
    if (status) filter.status = status;

    const sessions = await Session.find(filter)
      .populate('host', 'name avatar')
      .populate('participant', 'name avatar')
      .sort('date');

    res.json({ sessions });
  } catch (error) {
    next(error);
  }
};

exports.updateSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const { status, date, startTime, endTime, rating, feedback, notes } = req.body;
    
    if (status) session.status = status;
    if (date) session.date = date;
    if (startTime) session.startTime = startTime;
    if (endTime) session.endTime = endTime;
    if (rating) session.rating = rating;
    if (feedback) session.feedback = feedback;
    if (notes) session.notes = notes;

    // Handle completion
    if (status === 'completed') {
      const host = await User.findById(session.host);
      const participant = await User.findById(session.participant);

      // Award XP and SP to host
      host.xp += 50;
      host.teachingHours += session.duration / 60;
      host.sessionsHosted += 1;
      host.skillPoints += session.spCost;
      host.calculateLevel();
      await host.save();

      // Award XP to participant
      participant.xp += 30;
      participant.learningHours += session.duration / 60;
      participant.sessionsCompleted += 1;
      participant.calculateLevel();
      await participant.save();

      await Transaction.create({
        user: host._id,
        type: 'earned',
        amount: session.spCost,
        description: `Teaching session: ${session.title}`,
        relatedSession: session._id,
        balance: host.skillPoints,
      });
    }

    // Handle cancellation - refund
    if (status === 'cancelled') {
      const participant = await User.findById(session.participant);
      participant.skillPoints += session.spCost;
      await participant.save();

      await Transaction.create({
        user: participant._id,
        type: 'refund',
        amount: session.spCost,
        description: `Session cancelled: ${session.title}`,
        relatedSession: session._id,
        balance: participant.skillPoints,
      });
    }

    if (status === 'confirmed') {
      await Notification.create({
        recipient: session.participant,
        sender: session.host,
        type: 'session_confirmed',
        title: 'Session Confirmed',
        message: `Your ${session.skill} session has been confirmed!`,
        link: '/calendar',
      });
    }

    await session.save();
    const populated = await session.populate([
      { path: 'host', select: 'name avatar' },
      { path: 'participant', select: 'name avatar' },
    ]);
    res.json({ session: populated });
  } catch (error) {
    next(error);
  }
};

exports.getSessionById = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('host', 'name avatar')
      .populate('participant', 'name avatar');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ session });
  } catch (error) {
    next(error);
  }
};
