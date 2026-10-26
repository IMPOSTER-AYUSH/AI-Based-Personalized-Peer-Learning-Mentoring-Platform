const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    content: { type: String, required: true },
    image: { type: String, default: '' },
    reactions: {
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      hearts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      fires: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

postSchema.index({ community: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
