const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const protect = require('../middleware/auth');
const { runAsync, getAsync, allAsync } = require('../config/database');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

router.get('/', protect, (req, res) => {
  try {
    const achievements = allAsync('SELECT * FROM achievements WHERE studentId = ?', [req.user.id]);
    res.json(achievements || []);
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

router.post('/', protect, upload.single('proof'), (req, res) => {
  try {
    const { title, description, type, level, position, organizer, date } = req.body;
    runAsync('INSERT INTO achievements (studentId, title, description, type, level, position, organizer, date) VALUES (?,?,?,?,?,?,?,?)',
      [req.user.id, title, description, type, level, position || 'participant', organizer, date]);
    res.status(201).json({ message: 'Created' });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

module.exports = router;
