// src/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const NaverStrategy = require('passport-naver').Strategy;
const AppleStrategy = require('passport-apple');
const User = require('../models/User');
const logger = require('./logger');

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({
          socialId: profile.id,
          socialType: 'google'
        });

        // If user doesn't exist, create one
        if (!user) {
          user = await User.create({
            name: profile.displayName || `User-${profile.id}`,
            email: profile.emails[0].value,
            socialId: profile.id,
            socialType: 'google',
            profileImage: profile.photos[0]?.value || null
          });
        }

        return done(null, user);
      } catch (error) {
        logger.error(`Google strategy error: ${error.message}`);
        return done(error, null);
      }
    }
  )
);

// Kakao OAuth Strategy
passport.use(
  new KakaoStrategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID,
      callbackURL: process.env.KAKAO_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({
          socialId: profile.id,
          socialType: 'kakao'
        });

        // If user doesn't exist, create one
        if (!user) {
          user = await User.create({
            name: profile.displayName || profile.username || `User-${profile.id}`,
            email: profile._json?.kakao_account?.email || `kakao_${profile.id}@example.com`,
            socialId: profile.id,
            socialType: 'kakao',
            profileImage: profile._json?.properties?.profile_image || null
          });
        }

        return done(null, user);
      } catch (error) {
        logger.error(`Kakao strategy error: ${error.message}`);
        return done(error, null);
      }
    }
  )
);

// Naver OAuth Strategy
passport.use(
  new NaverStrategy(
    {
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      callbackURL: process.env.NAVER_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({
          socialId: profile.id,
          socialType: 'naver'
        });

        // If user doesn't exist, create one
        if (!user) {
          user = await User.create({
            name: profile.displayName || `User-${profile.id}`,
            email: profile.emails[0].value || `naver_${profile.id}@example.com`,
            socialId: profile.id,
            socialType: 'naver',
            profileImage: profile._json.profile_image || null
          });
        }

        return done(null, user);
      } catch (error) {
        logger.error(`Naver strategy error: ${error.message}`);
        return done(error, null);
      }
    }
  )
);

// Apple OAuth Strategy
passport.use(
  new AppleStrategy(
    {
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      // privateKeyLocation: process.env.APPLE_PRIVATE_KEY_LOCATION,
      privateKeyString: process.env.APPLE_PRIVATE_KEY_STRING,
      callbackURL: process.env.APPLE_CALLBACK_URL
    },
    async (req, accessToken, refreshToken, idToken, profile, done) => {
      try {
        // Apple doesn't provide much profile info, so we extract from idToken
        const appleId = profile.id;
        const email = profile.email;
        const name = req.body.user ? JSON.parse(req.body.user).name : `User-${appleId}`;
        
        // Check if user exists
        let user = await User.findOne({
          socialId: appleId,
          socialType: 'apple'
        });

        // If user doesn't exist, create one
        if (!user) {
          user = await User.create({
            name: name,
            email: email || `apple_${appleId}@example.com`,
            socialId: appleId,
            socialType: 'apple'
          });
        }

        return done(null, user);
      } catch (error) {
        logger.error(`Apple strategy error: ${error.message}`);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;