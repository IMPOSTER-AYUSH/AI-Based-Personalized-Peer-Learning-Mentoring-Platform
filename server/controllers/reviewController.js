const Review = require('../models/Review');
const User = require('../models/User');

exports.createReview = async (req, res, next) => {
  try {
    const { sessionId, revieweeId, rating, comment, skill } = req.body;

    const existing = await Review.findOne({
      reviewer: req.user._id,
      session: sessionId,
    });
    if (existing) return res.status(400).json({ message: 'Already reviewed this session' });

    const review = await Review.create({
      reviewer: req.user._id,
      reviewee: revieweeId,
      session: sessionId,
      rating,
      comment,
      skill,
    });

    // Update user rating
    const reviews = await Review.find({ reviewee: revieweeId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await User.findByIdAndUpdate(revieweeId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    });

    const populated = await review.populate('reviewer', 'name avatar');
    res.status(201).json({ review: populated });
  } catch (error) {
    next(error);
  }
};

exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name avatar')
      .sort('-createdAt');
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
};
