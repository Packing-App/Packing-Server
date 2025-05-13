# 🧳 패킹(Packing) Server

<div align="center">
  <p><strong>여행 준비물 관리 앱을 위한 백엔드 API 서버</strong></p>
  <p>Node.js, Express, MongoDB, Socket.io를 사용한 RESTful API</p>
</div>

---

## 📋 프로젝트 개요

패킹(Packing) 앱의 백엔드 API 서버입니다.
패킹 앱의 사용자 인증, 여행 정보 관리, 실시간 준비물 공유, 푸시 알림 등의 핵심 기능을 제공하기 위해 설계했습니다.

## 🔧 기술 스택

- **Node.js & Express**: 서버 프레임워크
- **MongoDB**: NoSQL 데이터베이스
- **Socket.io**: 실시간 통신
- **JWT**: 토큰 기반 인증
- **Passport.js**: 소셜 로그인 (Google, Kakao, Naver, Apple)
- **APNs**: iOS 푸시 알림
- **Node-cron**: 스케줄링 (알림 자동화)
- **AWS S3**: 이미지 저장소
- **SendGrid**: 이메일 서비스
- **OpenWeather API**: 날씨 정보
- **Unsplash API**: 여행지 이미지

## 📐 프로젝트 구조

```
├── 📁 config
│   ├── db.js                # MongoDB 연결 설정
│   ├── logger.js            # Winston 로거 설정
│   ├── passport.js          # 소셜 로그인 전략 설정
│   └── seedData.js          # 초기 데이터 시딩
├── 📁 controllers
│   ├── authController.js
│   ├── journeyController.js
│   ├── packingItemController.js
│   ├── socialAuthController.js
│   └── ...
├── 📁 data
│   └── cityTranslations.js  # 도시명 번역 데이터
├── 📁 middlewares
│   └── auth.js              # JWT 인증 미들웨어
├── 📁 models                # MongoDB 스키마
│   ├── User.js
│   ├── Journey.js
│   ├── PackingItem.js
│   ├── Notification.js
│   └── ...
├── 📁 routes                # API 라우트
│   ├── auth.js              # 인증 관련 라우트
│   ├── journeys.js
│   ├── packingItems.js
│   └── ...
├── 📁 services
│   ├── emailService.js      # 이메일 전송
│   ├── pushNotificationService.js  # 푸시 알림
│   └── itemRecommendationService.js
├── 📁 socket
│   └── socketSetup.js       # Socket.io 설정
├── 📁 utils
│   ├── scheduler.js         # 알림 스케줄러
│   ├── externalApiUtils.js  # 외부 API 통합
│   └── ...
├── app.js                   # Express 앱 설정
└── server.js               # 서버 진입점
```

## 📡 주요 기능

### 1. 사용자 인증
- JWT 기반 액세스/리프레시 토큰 시스템
- 소셜 로그인 (Google, Kakao, Naver, Apple)
- 이메일 인증
- 비밀번호 찾기/재설정

### 2. 여행 관리
- 여행 CRUD 작업
- 참가자 초대 및 관리
- 여행 테마별 맞춤 추천

### 3. 준비물 관리
- 개인/공용 준비물 구분
- 실시간 체크 상태 동기화
- 카테고리별 정리

### 4. 실시간 기능
- Socket.io를 통한 실시간 준비물 상태 공유
- 친구 요청/수락 알림
- 여행 초대 알림

### 5. 푸시 알림
- APNs를 통한 iOS 푸시 알림
- 여행 전날 리마인더
- 날씨 변화 알림
- 친구 활동 알림

### 6. 외부 API 연동
- OpenWeather API: 여행지 날씨 정보
- Unsplash API: 여행지 이미지
- SendGrid: 이메일 발송

## 📚 API 문서

전체 API 엔드포인트 문서는 아래 링크에서 확인할 수 있습니다.

[Postman API Documentation](https://documenter.getpostman.com/view/37011034/2sB2qUm45N)

### 주요 엔드포인트

- `POST /api/v1/auth/login` - 이메일 로그인
- `GET /api/v1/auth/google` - 구글 소셜 로그인
- `GET /api/v1/auth/kakao` - 카카오 소셜 로그인
- `GET /api/v1/auth/naver` - 네이버 소셜 로그인
- `POST /api/v1/auth/apple/verify` - 애플 로그인 검증
- `GET /api/v1/journeys` - 사용자 여행 목록
- `POST /api/v1/journeys` - 새 여행 생성
- `GET /api/v1/friends` - 친구 목록
- `POST /api/v1/friends/request` - 친구 요청

## 소셜 로그인 구현 (Oauth 2.0)

**OAuth 2.0 인증 플로우**
- iOS 앱에서 ASWebAuthenticationSession을 통해 소셜 로그인 요청 시작
- 백엔드 서버가 OAuth Provider (Google/Kakao/Naver)로 사용자를 리다이렉트
- 사용자 인증 후 Provider가 authorization code와 함께 콜백 URL로 리다이렉트
- 서버가 authorization code를 access token으로 교환하고 사용자 정보 획득
- JWT 토큰 생성 후 딥링크(packingapp://)로 iOS 앱에 전달하여 인증 완료

> 백엔드에서는 passport 라는 전략 패턴을 사용하여 인증 로직을 쉽게 구현할 수 있었습니다.


```javascript
// Passport Google Strategy 설정
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
//...
```

iOS 앱에서는 아래와 같이 ASWebAuthenticationSession을 사용하였고, 인증 완료 후 packingapp:// 스킴으로 리다이렉트하도록 하였습니다.
그리고 백엔드에서 미리 설정해둔 콜백 클로저에서 토큰과 사용자 정보 추출하도록 했습니다. 

```swift

    // ASWebAuthenticationSession을 사용
    let session = ASWebAuthenticationSession(
        url: url,
        callbackURLScheme: "packingapp"
    ) { callbackURL, error in
        if let error = error {
            subject.onError(AuthError.loginFailed)
            return
        }
        
        guard let callbackURL = callbackURL else {
            subject.onError(AuthError.loginFailed)
            return
        }
        
        // 딥링크 처리
        _ = self.handleDeepLink(callbackURL)
            .subscribe(onNext: { user in
                subject.onNext(user)
                subject.onCompleted()
            }, onError: { error in
                subject.onError(error)
            })
    }
```

## Socket.io 실시간 통신

JWT 토큰 기반 인증과 룸 시스템을 사용하여 실시간 데이터 동기화를 구현

**iOS 푸시 알림 (APNs)**

```javascript
const sendPushToIOS = async (deviceToken, title, body, data = {}) => {
  if (!apnProvider) {
    const initialized = initAPNProvider();
    if (!initialized) {
      logger.error('APN 서비스 초기화에 실패했습니다.');
      return { success: false, message: 'APN 서비스 초기화 실패' };
    }
  }
  
  try {
    const notification = new apn.Notification();
    
    notification.expiry = Math.floor(Date.now() / 1000) + 3600; // 1시간 후 만료
    notification.sound = 'default';
    notification.alert = {
      title: title,
      body: body
    };
    notification.topic = process.env.APPLE_CLIENT_ID; // 앱 번들 ID
    notification.payload = { ...data };
    
    const result = await apnProvider.send(notification, deviceToken);
    
    return { success: true, message: '푸시 알림 전송 성공' };
  } catch (error) {
    logger.error(`푸시 알림 전송 오류: ${error.message}`);
    return { success: false, message: `푸시 알림 전송 오류: ${error.message}` };
  }
};
```

### 알림 스케줄러

Node-cron을 사용한 자동 알림 시스템

```javascript
// 매일 오전 9시 여행 전날 알림
cron.schedule('0 9 * * *', async () => {
  try {
    logger.info('여행 전날 알림 스케줄러 실행 중...');
    await scheduleJourneyReminders();
  } catch (error) {
    logger.error(`여행 알림 스케줄러 오류: ${error.message}`);
  }
});

// 매일 오전 8시 날씨 알림
cron.schedule('0 8 * * *', async () => {
  try {
    logger.info('날씨 알림 스케줄러 실행 중...');
    await scheduleWeatherAlerts();
  } catch (error) {
    logger.error(`날씨 알림 스케줄러 오류: ${error.message}`);
  }
});
```

- iOS 레포지토리: [https://github.com/Packing-App/Packing-iOS](https://github.com/Packing-App/Packing-iOS)

_이 프로젝트는 패킹(Packing) iOS 앱의 백엔드 서버입니다._
