// src/routes/auth.js
const express = require('express');
const passport = require('passport');
const socialAuthController = require('../controllers/socialAuthController');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Basic auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', protect, authController.logout);

// Social auth routes
// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { session: false }), 
  socialAuthController.socialLoginSuccess
);

// Kakao OAuth
router.get('/kakao', passport.authenticate('kakao'));
router.get('/kakao/callback', 
  passport.authenticate('kakao', { session: false }), 
  socialAuthController.socialLoginSuccess
);

// Naver OAuth
router.get('/naver', passport.authenticate('naver'));
router.get('/naver/callback', 
  passport.authenticate('naver', { session: false }), 
  socialAuthController.socialLoginSuccess
);

// Apple OAuth
router.get('/apple', passport.authenticate('apple'));
router.post('/apple/callback', 
  passport.authenticate('apple', { session: false }), 
  socialAuthController.socialLoginSuccess
);

// Failure route for social login
router.get('/social-failure', socialAuthController.socialLoginFailure);

module.exports = router;

