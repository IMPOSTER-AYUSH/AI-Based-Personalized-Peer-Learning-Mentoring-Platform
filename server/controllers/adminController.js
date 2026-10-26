const User = require('../models/User');
const Session = require('../models/Session');
const Post = require('../models/Post');
const Community = require('../models/Community');
const Skill = require('../models/Skill');
const Report = require('../models/Report');
const Contact = require('../models/Contact');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');

exports.getStats = async (req, res, next) => {
  try {
    const [userCount, sessionCount, postCount, communityCount, contactCount, reportCount] = await Promise.all([
      User.countDocuments(),
      Session.countDocuments(),
      Post.countDocuments(),
      Community.countDocuments(),
      Contact.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
    ]);

    const recentUsers = await User.find().sort('-createdAt').limit(5).select('name email avatar createdAt role');

    res.json({
      stats: { userCount, sessionCount, postCount, communityCount, contactCount, reportCount },
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('name email avatar role profileCompleted createdAt lastActive skillPoints xp')
      .sort('-createdAt');
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

exports.banUser = async (req, res, next) => {
  try {
    // Soft ban by setting role to banned
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'banned' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user, message: 'User banned' });
  } catch (error) {
    next(error);
  }
};

// Skills management
exports.getSkills = async (req, res, next) => {
  try {
    const skills = await Skill.find().sort('category name');
    res.json({ skills });
  } catch (error) {
    next(error);
  }
};

exports.createSkill = async (req, res, next) => {
  try {
    const skill = await Skill.create(req.body);
    res.status(201).json({ skill });
  } catch (error) {
    next(error);
  }
};

exports.updateSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    res.json({ skill });
  } catch (error) {
    next(error);
  }
};

exports.deleteSkill = async (req, res, next) => {
  try {
    await Skill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Skill deleted' });
  } catch (error) {
    next(error);
  }
};

// Reports
exports.getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'name avatar')
      .populate('reportedUser', 'name avatar email')
      .populate('reportedPost')
      .sort('-createdAt');
    res.json({ reports });
  } catch (error) {
    next(error);
  }
};

exports.updateReport = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json({ report });
  } catch (error) {
    next(error);
  }
};

// Contacts
exports.getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find().sort('-createdAt');
    res.json({ contacts });
  } catch (error) {
    next(error);
  }
};

// Sessions monitor
exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find()
      .populate('host', 'name avatar')
      .populate('participant', 'name avatar')
      .sort('-createdAt')
      .limit(100);
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
};

// Blog management
exports.getBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find().sort('-createdAt');
    res.json({ blogs });
  } catch (error) {
    next(error);
  }
};

exports.createBlog = async (req, res, next) => {
  try {
    const blog = await Blog.create(req.body);
    res.status(201).json({ blog });
  } catch (error) {
    next(error);
  }
};
