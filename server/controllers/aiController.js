const { getDailyTip, getWeeklySummary, aiChatAssistant, getMatchScore } = require('../utils/ai');
const Session = require('../models/Session');

exports.getDailyTip = async (req, res, next) => {
  try {
    const tip = await getDailyTip(req.user);
    res.json({ tip });
  } catch (error) {
    next(error);
  }
};

exports.getWeeklySummary = async (req, res, next) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const sessions = await Session.find({
      $or: [{ host: req.user._id }, { participant: req.user._id }],
      status: 'completed',
      updatedAt: { $gte: weekAgo },
    });

    const stats = {
      learningHours: sessions
        .filter((s) => s.participant.toString() === req.user._id.toString())
        .reduce((sum, s) => sum + s.duration / 60, 0),
      teachingHours: sessions
        .filter((s) => s.host.toString() === req.user._id.toString())
        .reduce((sum, s) => sum + s.duration / 60, 0),
      sessionsCompleted: sessions.length,
      xpEarned: sessions.length * 40,
    };

    const summary = await getWeeklySummary(req.user, stats);
    res.json({ summary, stats });
  } catch (error) {
    next(error);
  }
};

exports.chatWithAI = async (req, res, next) => {
  try {
    const { messages } = req.body;
    const response = await aiChatAssistant(messages, {
      skillsLearning: req.user.skillsLearning,
      skillsTeaching: req.user.skillsTeaching,
    });
    res.json({ response });
  } catch (error) {
    next(error);
  }
};
