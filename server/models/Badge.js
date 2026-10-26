const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    category: {
      type: String,
      enum: ['learning', 'teaching', 'community', 'achievement', 'special'],
      default: 'achievement',
    },
    criteria: { type: String, required: true },
    xpReward: { type: Number, default: 50 },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Badge', badgeSchema);
