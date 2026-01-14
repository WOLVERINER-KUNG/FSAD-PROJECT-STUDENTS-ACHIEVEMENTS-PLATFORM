const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getAsync, allAsync, runAsync } = require('../config/database');

router.use(protect, roleCheck(['admin']));

router.get('/students', async (req, res) => {
  try {
    const students = allAsync('SELECT id, username, email, fullName, registrationNumber, department, year, phone FROM users WHERE role = ?', ['student']);
    res.json(students || []);
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});

router.get('/achievements', async (req, res) => {
  try {
    const { status } = req.query;
    const sql = status ? 'SELECT * FROM achievements WHERE status = ?' : 'SELECT * FROM achievements';
    const params = status ? [status] : [];
    const achievements = allAsync(sql, params);
    res.json(achievements || []);
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});

router.put('/achievements/:id/review', async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    runAsync('UPDATE achievements SET status = ?, remarks = ?, approvedBy = ? WHERE id = ?',
      [status, remarks || null, req.user.id, req.params.id]);
    res.json({ message: `Achievement ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});

router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalStudents = getAsync('SELECT COUNT(*) as count FROM users WHERE role = ?', ['student']);
    const totalAchievements = getAsync('SELECT COUNT(*) as count FROM achievements');
    const pendingApprovals = getAsync('SELECT COUNT(*) as count FROM achievements WHERE status = ?', ['pending']);
    const approvedAchievements = getAsync('SELECT COUNT(*) as count FROM achievements WHERE status = ?', ['approved']);

    res.json({
      totalStudents: totalStudents?.count || 0,
      totalAchievements: totalAchievements?.count || 0,
      pendingApprovals: pendingApprovals?.count || 0,
      approvedAchievements: approvedAchievements?.count || 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});

module.exports = router;
