const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skill: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, default: 60 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rescheduled'],
      default: 'pending',
    },
    spCost: { type: Number, default: 10 },
    notes: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String, default: '' },
    roomId: { type: String },
  },
  { timestamps: true }
);

sessionSchema.index({ host: 1, date: 1 });
sessionSchema.index({ participant: 1, date: 1 });

module.exports = mongoose.model('Session', sessionSchema);
