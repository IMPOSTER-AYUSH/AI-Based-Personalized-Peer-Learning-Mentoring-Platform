const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { generateToken, generateRandomToken, sendEmail } = require('../utils/helpers');

exports.register = async (req, res, next) => {
  try {
    const { email, password, name, skillsTeaching, skillsLearning } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const emailVerifyToken = generateRandomToken();
    const displayName = (name && name.trim()) ? name.trim() : email.split('@')[0];
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name: displayName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
      skillsTeaching: Array.isArray(skillsTeaching) ? skillsTeaching : [],
      skillsLearning: Array.isArray(skillsLearning) ? skillsLearning : [],
      experienceLevel: 'beginner',
      availability: [],
      profileCompleted: false,
      emailVerifyToken,
      emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Welcome bonus
    await Transaction.create({
      user: user._id,
      type: 'bonus',
      amount: 100,
      description: 'Welcome bonus! Start exchanging skills.',
      balance: 100,
    });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${emailVerifyToken}`;
    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Verify your SkillSwap email',
      html: `<h2>Welcome to SkillSwap!</h2><p>Click <a href="${verifyUrl}">here</a> to verify your email.</p><p>Or copy: ${verifyUrl}</p>`,
    });

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        skillsTeaching: user.skillsTeaching,
        skillsLearning: user.skillsLearning,
        profileCompleted: user.profileCompleted,
        role: user.role,
      },
      ...(emailResult.devMode && { devVerifyUrl: verifyUrl }),
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.password) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = generateToken(user._id);
    const userData = await User.findById(user._id).populate('badges');
    res.json({ token, user: userData });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('badges').populate('communities');
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({
      emailVerifyToken: token,
      emailVerifyExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired verification token' });

    user.isEmailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'No account with that email' });

    const resetToken = generateRandomToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Reset your SkillSwap password',
      html: `<h2>Password Reset</h2><p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>This link expires in 1 hour.</p><p>Or copy: ${resetUrl}</p>`,
    });

    res.json({
      message: 'Reset link sent to email',
      ...(emailResult.devMode && { devResetUrl: resetUrl }),
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

exports.googleCallback = async (req, res, next) => {
  try {
    const token = generateToken(req.user._id);
    res.redirect(`${process.env.CLIENT_URL}/auth/google/callback?token=${token}`);
  } catch (error) {
    next(error);
  }
};
