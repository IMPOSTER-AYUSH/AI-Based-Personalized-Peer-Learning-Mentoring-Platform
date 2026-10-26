const Goal = require('../models/Goal');
const User = require('../models/User');

exports.getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort('-createdAt');
    res.json({ goals });
  } catch (error) {
    next(error);
  }
};

exports.createGoal = async (req, res, next) => {
  try {
    const goal = await Goal.create({ ...req.body, user: req.user._id });
    res.status(201).json({ goal });
  } catch (error) {
    next(error);
  }
};

exports.updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    // Recalculate progress from tasks
    if (goal.tasks.length > 0) {
      const completed = goal.tasks.filter((t) => t.completed).length;
      goal.progress = Math.round((completed / goal.tasks.length) * 100);
    }

    // Award XP on completion
    if (goal.progress === 100 && goal.status !== 'completed') {
      goal.status = 'completed';
      const user = await User.findById(req.user._id);
      user.xp += goal.xpReward;
      user.calculateLevel();
      await user.save();
    }

    await goal.save();
    res.json({ goal });
  } catch (error) {
    next(error);
  }
};

exports.deleteGoal = async (req, res, next) => {
  try {
    await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    next(error);
  }
};

exports.getProgress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('badges');
    const goals = await Goal.find({ user: req.user._id });

    const Session = require('../models/Session');
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const weeklySessions = await Session.countDocuments({
      $or: [{ host: req.user._id }, { participant: req.user._id }],
      status: 'completed',
      updatedAt: { $gte: weekAgo },
    });

    const monthlySessions = await Session.countDocuments({
      $or: [{ host: req.user._id }, { participant: req.user._id }],
      status: 'completed',
      updatedAt: { $gte: monthAgo },
    });

    res.json({
      progress: {
        xp: user.xp,
        level: user.level,
        learningHours: user.learningHours,
        teachingHours: user.teachingHours,
        sessionsCompleted: user.sessionsCompleted,
        sessionsHosted: user.sessionsHosted,
        badges: user.badges,
        weeklySessions,
        monthlySessions,
        goals,
      },
    });
  } catch (error) {
    next(error);
  }
};
