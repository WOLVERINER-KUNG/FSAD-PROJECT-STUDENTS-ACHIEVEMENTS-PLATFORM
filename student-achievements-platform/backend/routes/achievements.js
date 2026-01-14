const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Achievement = require('../models/Achievement');
const protect = require('../middleware/auth');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Apply auth to all routes
router.use(protect);

// GET all achievements for logged-in student
router.get('/', async (req, res) => {
  try {
    const achievements = await Achievement.find({ student: req.user._id })
      .sort({ createdAt: -1 });

    res.json(achievements);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching achievements', error: err.message });
  }
});

// GET single achievement
router.get('/:id', async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);
    
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    // Check if user owns this achievement
    if (achievement.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this achievement' });
    }

    res.json(achievement);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching achievement', error: err.message });
  }
});

// CREATE new achievement
router.post('/', upload.single('proof'), async (req, res) => {
  try {
    const { title, description, type, level, position, organizer, date } = req.body;

    const achievement = new Achievement({
      student: req.user._id,
      title,
      description,
      type,
      level,
      position,
      organizer,
      date,
      proofFile: req.file ? req.file.filename : null
    });

    await achievement.save();
    res.status(201).json({ 
      message: 'Achievement created successfully', 
      achievement 
    });
  } catch (err) {
    res.status(500).json({ message: 'Error creating achievement', error: err.message });
  }
});

// UPDATE achievement
router.put('/:id', upload.single('proof'), async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);

    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    // Check ownership
    if (achievement.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this achievement' });
    }

    // Check status - only allow updates if pending
    if (achievement.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Can only update achievements with pending status' 
      });
    }

    const { title, description, type, level, position, organizer, date } = req.body;

    achievement.title = title || achievement.title;
    achievement.description = description || achievement.description;
    achievement.type = type || achievement.type;
    achievement.level = level || achievement.level;
    achievement.position = position || achievement.position;
    achievement.organizer = organizer || achievement.organizer;
    achievement.date = date || achievement.date;
    achievement.proofFile = req.file ? req.file.filename : achievement.proofFile;
    achievement.updatedAt = new Date();

    await achievement.save();
    res.json({ message: 'Achievement updated', achievement });
  } catch (err) {
    res.status(500).json({ message: 'Error updating achievement', error: err.message });
  }
});

// DELETE achievement (only if pending)
router.delete('/:id', async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);

    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    // Check ownership
    if (achievement.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this achievement' });
    }

    // Check status
    if (achievement.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Can only delete achievements with pending status' 
      });
    }

    await Achievement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Achievement deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting achievement', error: err.message });
  }
});

module.exports = router;
