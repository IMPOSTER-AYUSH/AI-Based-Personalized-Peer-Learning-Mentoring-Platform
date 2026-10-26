const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['earned', 'spent', 'bonus', 'refund'],
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    relatedSession: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    balance: { type: Number, required: true },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
