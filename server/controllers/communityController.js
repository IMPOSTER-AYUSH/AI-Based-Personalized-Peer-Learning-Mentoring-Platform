const Community = require('../models/Community');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Event = require('../models/Event');
const Challenge = require('../models/Challenge');
const User = require('../models/User');

exports.getCommunities = async (req, res, next) => {
  try {
    const communities = await Community.find()
      .populate('createdBy', 'name avatar')
      .sort('-memberCount');
    res.json({ communities });
  } catch (error) {
    next(error);
  }
};

exports.getCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('members', 'name avatar')
      .populate('createdBy', 'name avatar');
    if (!community) return res.status(404).json({ message: 'Community not found' });
    res.json({ community });
  } catch (error) {
    next(error);
  }
};

exports.joinCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    
    if (community.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already a member' });
    }

    community.members.push(req.user._id);
    community.memberCount += 1;
    await community.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: { communities: community._id },
    });

    res.json({ community });
  } catch (error) {
    next(error);
  }
};

exports.leaveCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    community.members = community.members.filter(
      (m) => m.toString() !== req.user._id.toString()
    );
    community.memberCount = Math.max(0, community.memberCount - 1);
    await community.save();

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { communities: community._id },
    });

    res.json({ community });
  } catch (error) {
    next(error);
  }
};

// Posts
exports.getPosts = async (req, res, next) => {
  try {
    const { communityId } = req.query;
    const filter = communityId ? { community: communityId } : {};
    const posts = await Post.find(filter)
      .populate('author', 'name avatar')
      .populate('community', 'name icon')
      .sort('-createdAt')
      .limit(50);
    res.json({ posts });
  } catch (error) {
    next(error);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const { content, communityId, image } = req.body;
    const post = await Post.create({
      author: req.user._id,
      community: communityId,
      content,
      image: image || '',
    });

    // Award XP for community contribution
    req.user.xp += 10;
    req.user.skillPoints += 2;
    req.user.calculateLevel();
    await req.user.save();

    const populated = await post.populate([
      { path: 'author', select: 'name avatar' },
      { path: 'community', select: 'name icon' },
    ]);
    res.status(201).json({ post: populated });
  } catch (error) {
    next(error);
  }
};

exports.reactToPost = async (req, res, next) => {
  try {
    const { reaction } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const reactionField = `reactions.${reaction}`;
    const hasReacted = post.reactions[reaction]?.includes(req.user._id);

    if (hasReacted) {
      post.reactions[reaction] = post.reactions[reaction].filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      post.reactions[reaction].push(req.user._id);
    }

    await post.save();
    res.json({ post });
  } catch (error) {
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
};

// Comments
exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'name avatar')
      .sort('createdAt');
    res.json({ comments });
  } catch (error) {
    next(error);
  }
};

exports.createComment = async (req, res, next) => {
  try {
    const comment = await Comment.create({
      post: req.params.postId,
      author: req.user._id,
      content: req.body.content,
    });

    await Post.findByIdAndUpdate(req.params.postId, { $inc: { commentCount: 1 } });
    const populated = await comment.populate('author', 'name avatar');
    res.status(201).json({ comment: populated });
  } catch (error) {
    next(error);
  }
};

// Events
exports.getEvents = async (req, res, next) => {
  try {
    const events = await Event.find()
      .populate('community', 'name icon')
      .populate('organizer', 'name avatar')
      .sort('date');
    res.json({ events });
  } catch (error) {
    next(error);
  }
};

exports.rsvpEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const isAttending = event.attendees.includes(req.user._id);
    if (isAttending) {
      event.attendees = event.attendees.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      if (event.attendees.length >= event.maxAttendees) {
        return res.status(400).json({ message: 'Event is full' });
      }
      event.attendees.push(req.user._id);
    }

    await event.save();
    res.json({ event });
  } catch (error) {
    next(error);
  }
};

// Challenges
exports.getChallenges = async (req, res, next) => {
  try {
    const challenges = await Challenge.find()
      .populate('community', 'name icon')
      .sort('-startDate');
    res.json({ challenges });
  } catch (error) {
    next(error);
  }
};

exports.joinChallenge = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    if (challenge.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already participating' });
    }

    challenge.participants.push(req.user._id);
    await challenge.save();
    res.json({ challenge });
  } catch (error) {
    next(error);
  }
};

// Leaderboard
exports.getLeaderboard = async (req, res, next) => {
  try {
    const users = await User.find({ profileCompleted: true })
      .select('name avatar xp level sessionsCompleted sessionsHosted')
      .sort('-xp')
      .limit(20);
    res.json({ leaderboard: users });
  } catch (error) {
    next(error);
  }
};
