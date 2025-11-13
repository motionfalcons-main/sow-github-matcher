import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  repoId: { type: String, required: true },
  repoName: { type: String, required: true },
  repoUrl: { type: String, required: true },
  description: String,
  stars: Number,
  language: String,
  topics: [String],
  compatibility: {
    score: Number,
    matchingFeatures: [String],
    missingFeatures: [String],
    renderDeployment: Object,
    recommendation: String
  },
  notes: String,
  tags: [String],
  addedAt: { type: Date, default: Date.now },
  votes: [{
    userId: String,
    vote: Number,
    votedAt: { type: Date, default: Date.now }
  }]
});

const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  userId: String,
  teamId: String,
  projects: [projectSchema],
  isPublic: { type: Boolean, default: false },
  sharedWith: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

collectionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Collection', collectionSchema);

