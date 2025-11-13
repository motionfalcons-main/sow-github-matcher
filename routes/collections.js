import express from 'express';
import Collection from '../models/Collection.js';
import { isDatabaseConnected } from '../config/database.js';

const router = express.Router();

// Middleware to check if database is available
const requireDatabase = (req, res, next) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ 
      error: 'Database not available. Collections feature is disabled.',
      message: 'Set MONGODB_URI environment variable to enable collections.'
    });
  }
  next();
};

// Get all collections for a user (using session ID for now, can add auth later)
router.get('/', requireDatabase, async (req, res) => {
  try {
    const userId = req.query.userId || 'default-user'; // TODO: Add authentication
    const collections = await Collection.find({ userId }).sort({ updatedAt: -1 });
    res.json(collections);
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new collection
router.post('/', requireDatabase, async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    const userId = req.body.userId || 'default-user'; // TODO: Add authentication
    
    if (!name) {
      return res.status(400).json({ error: 'Collection name is required' });
    }
    
    const collection = new Collection({
      name,
      description,
      userId,
      isPublic: isPublic || false,
      projects: []
    });
    
    await collection.save();
    res.status(201).json(collection);
  } catch (error) {
    console.error('Create collection error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get collection by ID
router.get('/:id', requireDatabase, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json(collection);
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add project to collection
router.post('/:id/projects', requireDatabase, async (req, res) => {
  try {
    const { project, notes, tags } = req.body;
    
    if (!project) {
      return res.status(400).json({ error: 'Project data is required' });
    }
    
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    // Check if project already exists in collection
    const exists = collection.projects.find(p => p.repoId === project.id?.toString());
    if (exists) {
      return res.status(400).json({ error: 'Project already in collection' });
    }
    
    collection.projects.push({
      repoId: project.id?.toString() || project.repoId,
      repoName: project.name,
      repoUrl: project.url || project.html_url,
      description: project.description,
      stars: project.stars || project.stargazers_count,
      language: project.language,
      topics: project.topics || [],
      compatibility: project.comparison || project.compatibility,
      notes: notes || '',
      tags: tags || []
    });
    
    await collection.save();
    res.json(collection);
  } catch (error) {
    console.error('Add project error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove project from collection
router.delete('/:id/projects/:projectId', requireDatabase, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    collection.projects = collection.projects.filter(
      p => p._id.toString() !== req.params.projectId
    );
    
    await collection.save();
    res.json(collection);
  } catch (error) {
    console.error('Remove project error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update project notes/tags
router.patch('/:id/projects/:projectId', requireDatabase, async (req, res) => {
  try {
    const { notes, tags } = req.body;
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    const project = collection.projects.find(p => p._id.toString() === req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found in collection' });
    }
    
    if (notes !== undefined) project.notes = notes;
    if (tags !== undefined) project.tags = tags;
    
    await collection.save();
    res.json(collection);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Vote on project
router.post('/:id/projects/:projectId/vote', requireDatabase, async (req, res) => {
  try {
    const { vote, userId } = req.body;
    const actualUserId = userId || 'default-user';
    
    if (![1, -1].includes(vote)) {
      return res.status(400).json({ error: 'Vote must be 1 or -1' });
    }
    
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    const project = collection.projects.find(p => p._id.toString() === req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found in collection' });
    }
    
    // Remove existing vote from this user
    project.votes = project.votes.filter(v => v.userId !== actualUserId);
    
    // Add new vote
    project.votes.push({ userId: actualUserId, vote });
    
    await collection.save();
    res.json(collection);
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete collection
router.delete('/:id', requireDatabase, async (req, res) => {
  try {
    const collection = await Collection.findByIdAndDelete(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

