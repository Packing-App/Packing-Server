// src/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const NaverStrategy = require('passport-naver').Strategy;
// const AppleStrategy = require('passport-apple');
const User = require('../models/User');
const logger = require('./logger');

const axios = require('axios');

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
// 카카오 OAuth - 올바른 scope 사용
passport.use(
  new KakaoStrategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID,
      callbackURL: process.env.KAKAO_CALLBACK_URL,
      // 카카오 OAuth 2.0 올바른 scope
      // profile_nickname, profile_image는 기본 제공
      // account_email (X) -> account_email이 아니라 account_email은 기본 제공됨
      // 추가 권한이 필요한 경우만 scope에 명시
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 디버깅을 위한 프로필 정보 로깅
        logger.info('Kakao Profile Data:', JSON.stringify(profile, null, 2));
        logger.info('Kakao Access Token:', accessToken);
        
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

        // 카카오톡 프로필에서 이름과 이메일 추출
        let kakaoName = null;
        let kakaoEmail = null;
        let profileImage = null;

        // 1. 카카오 계정 정보 확인 - 최신 API 구조
        if (profile._json && profile._json.kakao_account) {
          const kakaoAccount = profile._json.kakao_account;
          
          // 이메일 추출 - has_email 체크
          if (kakaoAccount.has_email && !kakaoAccount.email_needs_agreement) {
            kakaoEmail = kakaoAccount.email;
          }
          
          // 프로필 정보에서 닉네임 추출
          if (kakaoAccount.profile && !kakaoAccount.profile_nickname_needs_agreement) {
            kakaoName = kakaoAccount.profile.nickname;
          }
          
          // 프로필 이미지 추출
          if (kakaoAccount.profile && !kakaoAccount.profile_image_needs_agreement) {
            profileImage = kakaoAccount.profile.profile_image_url;
            // HTTP를 HTTPS로 변환
            if (profileImage) {
              profileImage = profileImage.replace('http://', 'https://');
            }
          }
        }
        
        // 2. properties에서 정보 추출 (구버전 API 호환)
        if (!kakaoName && profile._json && profile._json.properties) {
          if (profile._json.properties.nickname) {
            kakaoName = profile._json.properties.nickname;
          }
        }
        
        if (!profileImage && profile._json && profile._json.properties) {
          if (profile._json.properties.profile_image) {
            profileImage = profile._json.properties.profile_image.replace('http://', 'https://');
          }
        }
        
        // 3. displayName 사용
        if (!kakaoName && profile.displayName) {
          kakaoName = profile.displayName;
        }
        
        // 4. 추가 API 호출로 정보 획득 시도
        if (!kakaoName || kakaoName === '미연동 계정') {
          try {
            const userInfoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
              }
            });
            
            logger.info('Kakao API Direct Call Response:', JSON.stringify(userInfoResponse.data, null, 2));
            
            // API 직접 호출 응답에서 정보 추출
            if (userInfoResponse.data) {
              const data = userInfoResponse.data;
              
              // properties에서 닉네임 추출
              if (data.properties && data.properties.nickname) {
                kakaoName = data.properties.nickname;
              }
              
              // kakao_account에서 프로필 정보 추출
              if (data.kakao_account) {
                if (data.kakao_account.profile && data.kakao_account.profile.nickname) {
                  kakaoName = data.kakao_account.profile.nickname;
                }
                
                if (data.kakao_account.email) {
                  kakaoEmail = data.kakao_account.email;
                }
              }
            }
          } catch (apiError) {
            logger.error('카카오 사용자 정보 API 호출 실패:', apiError);
          }
        }
        
        // 5. 최종 기본값 설정
        if (!kakaoName || kakaoName === '미연동 계정') {
          kakaoName = `카카오사용자${profile.id.toString().substring(0, 6)}`;
        }
        
        if (!kakaoEmail) {
          kakaoEmail = `kakao_${profile.id}@example.com`;
        }

        // 사용자 정보 로깅
        logger.info(`카카오 정보 추출 결과: 이름=${kakaoName}, 이메일=${kakaoEmail}, 이미지=${profileImage || 'None'}`);

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
          // 기존 사용자의 정보 업데이트
          let updated = false;
          
          // "미연동 계정" 또는 이름이 없는 경우 업데이트
          if (user.name === "미연동 계정" || !user.name) {
            user.name = kakaoName;
            updated = true;
          }
          
          // 프로필 이미지가 없는 경우에도 업데이트
          if (!user.profileImage && profileImage) {
            user.profileImage = profileImage;
            updated = true;
          }
          
          // HTTP를 HTTPS로 변환
          if (user.profileImage && user.profileImage.startsWith('http://')) {
            user.profileImage = user.profileImage.replace('http://', 'https://');
            updated = true;
          }
          
          if (updated) {
            await user.save();
            logger.info(`카카오 사용자 정보 업데이트: ${user.email}, 새 이름: ${user.name}`);
          }
          
          logger.info(`기존 카카오 사용자 로그인: ${user.email}, 이름: ${user.name}`);
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