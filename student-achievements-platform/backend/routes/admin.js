const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');
const User = require('../models/User');
const protect = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Apply auth and admin check to all routes
router.use(protect, roleCheck(['admin']));

// GET all students
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching students', error: err.message });
  }
});

// GET specific student with achievements
router.get('/students/:id', async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const achievements = await Achievement.find({ student: req.params.id })
      .populate('student', 'fullName email registrationNumber');

    res.json({ student, achievements });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching student', error: err.message });
  }
});

// GET all achievements (pending review)
router.get('/achievements', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const achievements = await Achievement.find(filter)
      .populate('student', 'fullName email registrationNumber')
      .sort({ createdAt: -1 });

    res.json(achievements);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching achievements', error: err.message });
  }
});

// APPROVE or REJECT achievement
router.put('/achievements/:id/review', async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const achievement = await Achievement.findByIdAndUpdate(
      req.params.id,
      {
        status,
        remarks,
        approvedBy: req.user._id,
        approvedAt: new Date()
      },
      { new: true }
    );

    if (!achievement) return res.status(404).json({ message: 'Achievement not found' });

    res.json({ message: `Achievement ${status}`, achievement });
  } catch (err) {
    res.status(500).json({ message: 'Error reviewing achievement', error: err.message });
  }
});

// DELETE achievement
router.delete('/achievements/:id', async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndDelete(req.params.id);
    if (!achievement) return res.status(404).json({ message: 'Achievement not found' });

    res.json({ message: 'Achievement deleted', achievement });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting achievement', error: err.message });
  }
});

// GET dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalAchievements = await Achievement.countDocuments();
    const pendingApprovals = await Achievement.countDocuments({ status: 'pending' });
    const approvedAchievements = await Achievement.countDocuments({ status: 'approved' });

    res.json({
      totalStudents,
      totalAchievements,
      pendingApprovals,
      approvedAchievements
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats', error: err.message });
  }
});

module.exports = router;
