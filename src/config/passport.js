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
        // 카카오톡 프로필에서 이름 정보 추출 (수정된 부분)
        let kakaoName = "카카오 사용자";
        
        // 1. properties의 nickname이 있는지 확인 (카카오톡 기본 값)
        if (profile._json && profile._json.properties && profile._json.properties.nickname) {
          kakaoName = profile._json.properties.nickname;
        } 
        // 2. kakao_account의 profile 정보 확인
        else if (profile._json && profile._json.kakao_account && profile._json.kakao_account.profile && 
                profile._json.kakao_account.profile.nickname) {
          kakaoName = profile._json.kakao_account.profile.nickname;
        }
        // 3. displayName 사용
        else if (profile.displayName) {
          kakaoName = profile.displayName;
        }
        // 4. 기본값에 ID 추가
        else {
          kakaoName = `카카오 사용자-${profile.id.toString().substring(0, 4)}`;
        }

        // 사용자가 존재하지 않는 경우 새로 생성
        if (!user) {
          user = await User.create({
            name: kakaoName,
            email: profile._json?.kakao_account?.email || `kakao_${profile.id}@example.com`,
            socialId: profile.id,
            socialType: 'kakao',
            profileImage: profile._json?.properties?.profile_image || 
                         (profile._json?.kakao_account?.profile?.profile_image_url) || 
                         null
          });
          logger.info(`새 카카오 사용자 생성: ${user.email}, 이름: ${kakaoName}`);
        } else {
          // "미연동 계정"인 경우 이름 업데이트
          if (user.name === "미연동 계정" || !user.name) {
            user.name = kakaoName;
            await user.save();
            logger.info(`카카오 사용자 이름 업데이트: ${user.email}, 새 이름: ${kakaoName}`);
          }
          logger.info(`기존 카카오 사용자 발견: ${user.email}, 이름: ${user.name}`);
        }

        return done(null, user);
      } catch (error) {
        logger.error(`카카오 전략 오류: ${error.message}`);
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