const User = require('../models/User');

exports.updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    const allowedFields = [
      'name', 'bio', 'avatar', 'coverImage', 'skillsTeaching', 'skillsLearning',
      'availability', 'experienceLevel', 'socialLinks', 'notificationPreferences', 'theme',
    ];
    
    const filteredUpdates = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) filteredUpdates[key] = updates[key];
    }

    // Check if profile setup is complete
    if (
      filteredUpdates.name ||
      (filteredUpdates.skillsTeaching && filteredUpdates.skillsTeaching.length > 0) ||
      (filteredUpdates.skillsLearning && filteredUpdates.skillsLearning.length > 0)
    ) {
      filteredUpdates.profileCompleted = true;
    }

    const user = await User.findByIdAndUpdate(req.user._id, filteredUpdates, {
      new: true,
      runValidators: true,
    }).populate('badges').populate('communities');

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('badges')
      .populate('communities')
      .select('-password -emailVerifyToken -resetPasswordToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    
    if (user.password) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

exports.searchUsers = async (req, res, next) => {
  try {
    const { q, skill, level } = req.query;
    const filter = { _id: { $ne: req.user._id } };
    
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { skillsTeaching: { $regex: q, $options: 'i' } },
        { skillsLearning: { $regex: q, $options: 'i' } },
      ];
    }
    if (skill) {
      filter.$or = [
        { skillsTeaching: { $regex: skill, $options: 'i' } },
        { skillsLearning: { $regex: skill, $options: 'i' } },
      ];
    }
    if (level) filter.experienceLevel = level;

    const users = await User.find(filter)
      .select('name avatar bio skillsTeaching skillsLearning experienceLevel rating reviewCount')
      .limit(50);
    res.json({ users });
  } catch (error) {
    next(error);
  }
};
