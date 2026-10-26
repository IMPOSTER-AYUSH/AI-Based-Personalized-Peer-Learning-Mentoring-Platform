const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    skill: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    xpReward: { type: Number, default: 200 },
    spReward: { type: Number, default: 50 },
    coverImage: { type: String, default: '' },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed'],
      default: 'upcoming',
    },
    tasks: [
      {
        title: String,
        description: String,
        order: Number,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Challenge', challengeSchema);
