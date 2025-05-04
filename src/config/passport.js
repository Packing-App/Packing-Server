// src/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const NaverStrategy = require('passport-naver').Strategy;
// const AppleStrategy = require('passport-apple');
const User = require('../models/User');
const logger = require('./logger');

// Google OAuth Strategy

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true // Add this to get more context in the verification callback
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Log full profile for debugging
        logger.info('Google Profile Data:', JSON.stringify(profile, null, 2));
        logger.info('Access Token:', accessToken);
        
        // Validate profile data
        if (!profile.id) {
          logger.error('Invalid Google profile: Missing ID');
          return done(new Error('Invalid Google profile'), null);
        }

        // More robust email extraction
        const email = profile.emails && profile.emails.length > 0 
          ? profile.emails[0].value 
          : `google_${profile.id}@example.com`;

        // Check if user exists with more detailed logging
        let user = await User.findOne({
          socialId: profile.id,
          socialType: 'google'
        });

        // If user doesn't exist, create with more robust data handling
        if (!user) {
          user = await User.create({
            name: profile.displayName || `GoogleUser-${profile.id}`,
            email: email,
            socialId: profile.id,
            socialType: 'google',
            profileImage: profile.photos && profile.photos.length > 0 
              ? profile.photos[0].value 
              : null
          });

          logger.info(`New Google user created: ${user.email}`);
        } else {
          logger.info(`Existing Google user found: ${user.email}`);
        }

        return done(null, user);
      } catch (error) {
        logger.error(`Google OAuth Error: ${error.message}`);
        logger.error(`Error Stack: ${error.stack}`);
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

module.exports = passport;