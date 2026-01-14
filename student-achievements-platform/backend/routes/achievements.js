const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Achievement = require('../models/Achievement');
const { protect, adminOnly } = require('../middleware/auth');

// Multer setup - file upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb('Error: Only images & PDFs allowed!');
  }
});

// Create uploads folder manually or use mkdirp

// @route   POST /api/achievements
router.post('/', protect, upload.single('proof'), async (req, res) => {
  try {
    const { title, category, description, date } = req.body;

    const achievement = new Achievement({
      student: req.user.id,
      title,
      category,
      description,
      date,
      proofFile: req.file ? req.file.filename : null
    });

    await achievement.save();
    res.status(201).json(achievement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/achievements/my
router.get('/my', protect, async (req, res) => {
  try {
    const achievements = await Achievement.find({ student: req.user.id })
      .sort({ createdAt: -1 });
    res.json(achievements);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/achievements/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);
    
    if (!achievement) return res.status(404).json({ message: 'Achievement not found' });
    if (achievement.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, category, description, date } = req.body;

    achievement.title = title || achievement.title;
    achievement.category = category || achievement.category;
    achievement.description = description || achievement.description;
    achievement.date = date || achievement.date;

    await achievement.save();
    res.json(achievement);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/achievements/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);
    
    if (!achievement) return res.status(404).json({ message: 'Not found' });
    if (achievement.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await achievement.deleteOne();
    res.json({ message: 'Achievement removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ──────────────────────────────────────────────
//                ADMIN ROUTES
// ──────────────────────────────────────────────

// @route   GET /api/achievements/all
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const achievements = await Achievement.find()
      .populate('student', 'username')
      .sort({ createdAt: -1 });
    res.json(achievements);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/achievements/:id/status
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const achievement = await Achievement.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!achievement) return res.status(404).json({ message: 'Not found' });
    res.json(achievement);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;