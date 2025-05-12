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
// 카카오 OAuth - 수정된 버전
passport.use(
  new KakaoStrategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID,
      callbackURL: process.env.KAKAO_CALLBACK_URL,
      // scope 수정 - 카카오 API v2 기준
      scope: ['profile_nickname', 'profile_image', 'account_email'],
      // 추가 설정
      scopeSeparator: ',',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 디버깅을 위한 프로필 정보 로깅
        logger.info('Kakao Profile Data:', JSON.stringify(profile, null, 2));
        
        // 사용자 ID 유효성 검사
        if (!profile.id) {
          logger.error('Invalid Kakao profile: Missing ID');
          return done(new Error('Invalid Kakao profile'), null);
        }

        // 기존 사용자 검색
        let user = await User.findOne({
          socialId: profile.id,
          socialType: 'kakao'
        });

        // 카카오톡 프로필에서 정보 추출
        let kakaoName = null;
        let kakaoEmail = null;
        let profileImage = null;

        // 카카오 API v2 응답 구조에 맞게 수정
        if (profile._json && profile._json.kakao_account) {
          const kakaoAccount = profile._json.kakao_account;
          
          // 이메일 추출 - 이메일 검증 상태도 확인
          if (kakaoAccount.has_email && kakaoAccount.email) {
            kakaoEmail = kakaoAccount.email;
          }
          
          // 프로필 정보 확인 - 닉네임 동의 여부 확인
          if (kakaoAccount.profile_nickname_needs_agreement === false && 
              kakaoAccount.profile && 
              kakaoAccount.profile.nickname) {
            kakaoName = kakaoAccount.profile.nickname;
          }
          
          // 프로필 이미지 확인
          if (kakaoAccount.profile_image_needs_agreement === false && 
              kakaoAccount.profile && 
              kakaoAccount.profile.profile_image_url) {
            profileImage = kakaoAccount.profile.profile_image_url.replace('http://', 'https://');
          }
        }
        
        // displayName으로 대체 시도
        if (!kakaoName && profile.displayName) {
          kakaoName = profile.displayName;
        }
        
        // properties로 대체 시도 (구 API 호환)
        if (!kakaoName && profile._json && profile._json.properties) {
          if (profile._json.properties.nickname) {
            kakaoName = profile._json.properties.nickname;
          }
        }
        
        // 이름이 여전히 없거나 '미연동 계정'인 경우
        if (!kakaoName || kakaoName === '미연동 계정') {
          // API를 통해 사용자 정보 재조회 시도
          try {
            const userInfoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            
            if (userInfoResponse.data.properties && userInfoResponse.data.properties.nickname) {
              kakaoName = userInfoResponse.data.properties.nickname;
            }
          } catch (apiError) {
            logger.error('카카오 사용자 정보 API 호출 실패:', apiError);
          }
          
          // 그래도 없으면 기본값 설정
          if (!kakaoName || kakaoName === '미연동 계정') {
            kakaoName = `카카오사용자${profile.id.toString().substring(0, 6)}`;
          }
        }
        
        // 이메일 기본값 설정
        if (!kakaoEmail) {
          kakaoEmail = `kakao_${profile.id}@example.com`;
        }

        // 사용자 정보 로깅
        logger.info(`카카오 정보 최종 결과: 이름=${kakaoName}, 이메일=${kakaoEmail}, 이미지=${profileImage || 'None'}`);

        // 사용자가 존재하지 않는 경우 새로 생성
        if (!user) {
          user = await User.create({
            name: kakaoName,
            email: kakaoEmail,
            socialId: profile.id,
            socialType: 'kakao',
            profileImage: profileImage
          });
          logger.info(`새 카카오 사용자 생성: ${user.email}, 이름: ${kakaoName}`);
        } else {
          // 기존 사용자 정보 업데이트
          let updated = false;
          
          // '미연동 계정'이거나 이름이 없는 경우 업데이트
          if (user.name === '미연동 계정' || !user.name || user.name.startsWith('카카오사용자')) {
            user.name = kakaoName;
            updated = true;
          }
          
          // 프로필 이미지 업데이트
          if (!user.profileImage && profileImage) {
            user.profileImage = profileImage;
            updated = true;
          }
          
          // HTTP URL을 HTTPS로 변경
          if (user.profileImage && user.profileImage.startsWith('http://')) {
            user.profileImage = user.profileImage.replace('http://', 'https://');
            updated = true;
          }
          
          if (updated) {
            await user.save();
            logger.info(`카카오 사용자 정보 업데이트: ${user.email}, 이름: ${user.name}`);
          }
        }

        return done(null, user);
      } catch (error) {
        logger.error(`카카오 OAuth 오류: ${error.message}`);
        logger.error(`에러 스택: ${error.stack}`);
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