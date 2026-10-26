const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    coverImage: { type: String, default: '' },
    author: { type: String, required: true },
    authorAvatar: { type: String, default: '' },
    category: { type: String, required: true },
    tags: [String],
    readTime: { type: Number, default: 5 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);
