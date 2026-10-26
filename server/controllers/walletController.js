const Transaction = require('../models/Transaction');
const User = require('../models/User');

exports.getWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const transactions = await Transaction.find({ user: req.user._id })
      .populate('relatedUser', 'name avatar')
      .sort('-createdAt')
      .limit(50);

    const totalEarned = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'earned' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalSpent = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'spent' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      wallet: {
        balance: user.skillPoints,
        totalEarned: totalEarned[0]?.total || 0,
        totalSpent: totalSpent[0]?.total || 0,
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};
