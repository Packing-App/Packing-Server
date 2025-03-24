// src/routes/auth.js
const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Basic auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', protect, authController.logout);

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working!' });
});

module.exports = router;