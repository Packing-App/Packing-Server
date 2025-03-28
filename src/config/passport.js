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

// Apple OAuth Strategy

// passport.use(
//   new AppleStrategy(
//     {
//       clientID: process.env.APPLE_CLIENT_ID,
//       teamID: process.env.APPLE_TEAM_ID,
//       keyID: process.env.APPLE_KEY_ID,
//       privateKeyString: process.env.APPLE_PRIVATE_KEY_STRING,
//       callbackURL: process.env.APPLE_CALLBACK_URL,
//       passReqToCallback: true // 추가: 요청 객체에 접근 가능
//     },
//     async (req, accessToken, refreshToken, idToken, profile, done) => {
//       try {
//         // 애플 로그인 추가 검증 엔드포인트에서 전달된 데이터 처리
//         const { userId, email, fullName } = req.body;

//         // idToken 디코딩 및 검증
//         const decodedToken = jwt.decode(idToken);
        
//         // 사용자 식별자 확인 (Apple의 고유 식별자)
//         const appleId = userId || decodedToken.sub;
        
//         // 이메일 처리 (클라이언트에서 받은 이메일 또는 토큰의 이메일 사용)
//         const userEmail = email || 
//           (decodedToken.email ? decodedToken.email : `apple_${appleId}@example.com`);
        
//         // 이름 처리
//         const userName = fullName 
//           ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() 
//           : `AppleUser-${appleId}`;

//         // 기존 사용자 찾기
//         let user = await User.findOne({
//           socialId: appleId,
//           socialType: 'apple'
//         });

//         // 사용자 없으면 새로 생성
//         if (!user) {
//           user = await User.create({
//             name: userName,
//             email: userEmail,
//             socialId: appleId,
//             socialType: 'apple'
//           });

//           logger.info(`New Apple user created: ${userEmail}`);
//         } else {
//           // 기존 사용자 정보 업데이트 (선택적)
//           user.name = userName;
//           user.email = userEmail;
//           await user.save();

//           logger.info(`Existing Apple user found: ${userEmail}`);
//         }

//         return done(null, user);
//       } catch (error) {
//         logger.error(`Apple OAuth Error: ${error.message}`);
//         logger.error(`Error Stack: ${error.stack}`);
//         return done(error, null);
//       }
//     }
//   )
// );

module.exports = passport;