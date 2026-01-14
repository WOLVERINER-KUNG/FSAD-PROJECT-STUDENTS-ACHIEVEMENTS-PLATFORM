const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['event', 'award', 'recognition', 'participation', 'competition'],
    required: true
  },
  level: {
    type: String,
    enum: ['college', 'state', 'national', 'international'],
    required: true
  },
  position: {
    type: String,
    enum: ['winner', 'runner-up', 'participant', 'organizer', 'speaker'],
    default: 'participant'
  },
  organizer: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  proofFile: {
    type: String,
    sparse: true
  },
  certificate: {
    type: String,
    sparse: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  approvedAt: {
    type: Date,
    sparse: true
  },
  remarks: {
    type: String,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Achievement', achievementSchema);
