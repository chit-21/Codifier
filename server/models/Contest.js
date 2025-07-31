const mongoose = require('mongoose');
if (mongoose.models.Contest) {
  delete mongoose.models.Contest;
}
const contestSchema = new mongoose.Schema({
  // Basic contest information
  name: {
    type: String,
    required: true,
    trim: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['codeforces', 'leetcode', 'atcoder', 'codechef', 'gfg', 'codingninjas'],
    lowercase: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  
  // Timing information
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    required: true
  },
  
  // Contest status
  status: {
    type: String,
    enum: ['upcoming', 'live', 'ended'],
    default: 'upcoming'
  },
  
  // Additional information
  description: {
    type: String,
    default: ''
  },
  registrationRequired: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Indexes for better query performance
contestSchema.index({ platform: 1 });
contestSchema.index({ startTime: 1 });
contestSchema.index({ status: 1 });
contestSchema.index({ platform: 1, status: 1 });

// Virtual field to get contest status based on current time
contestSchema.virtual('currentStatus').get(function() {
  const now = new Date();
  if (now < this.startTime) {
    return 'upcoming';
  } else if (now >= this.startTime && now <= this.endTime) {
    return 'live';
  } else {
    return 'ended';
  }
});

// Method to check if contest is starting soon (within next hour)
contestSchema.methods.isStartingSoon = function() {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  return this.startTime <= oneHourFromNow && this.startTime > now;
};

// Static method to find upcoming contests
contestSchema.statics.findUpcoming = function() {
  return this.find({
    startTime: { $gt: new Date() }
  }).sort({ startTime: 1 });
};

// Static method to find live contests
contestSchema.statics.findLive = function() {
  const now = new Date();
  return this.find({
    startTime: { $lte: now },
    endTime: { $gte: now }
  }).sort({ startTime: 1 });
};

// Static method to find contests by platform
contestSchema.statics.findByPlatform = function(platform) {
  return this.find({ platform: platform.toLowerCase() })
    .sort({ startTime: 1 });
};

// Pre-save middleware to update the status based on current time
contestSchema.pre('save', function(next) {
  this.status = this.currentStatus;
  this.updatedAt = new Date();
  next();
});

const Contest = mongoose.model('Contest', contestSchema);

module.exports = Contest;
