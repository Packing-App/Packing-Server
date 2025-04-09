// src/socket/socketSetup.js
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Socket.IO 서버 설정
 * @param {Object} server HTTP 서버 인스턴스
 */
const setupSocketIO = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // 인증 미들웨어
  io.use(async (socket, next) => {
    try {
      // 토큰 확인
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('인증 토큰이 필요합니다'));
      }

      // 토큰 검증
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 사용자 정보 가져오기
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('사용자를 찾을 수 없습니다'));
      }

      // 소켓에 사용자 정보 저장
      socket.user = {
        _id: user._id,
        name: user.name,
        email: user.email
      };
      
      next();
    } catch (error) {
      logger.error(`Socket 인증 오류: ${error.message}`);
      next(new Error('인증에 실패했습니다'));
    }
  });

  // 연결 이벤트
  io.on('connection', (socket) => {
    const userId = socket.user._id;
    logger.info(`사용자 연결됨: ${userId}`);

    // 사용자별 룸 조인 (개인 알림용)
    socket.join(`user-${userId}`);

    // 여행 룸 조인 이벤트
    socket.on('join-journey', (journeyId) => {
      socket.join(`journey-${journeyId}`);
      logger.info(`사용자 ${userId}가 여행 룸 ${journeyId}에 참여했습니다`);
    });

    // 여행 룸 나가기 이벤트
    socket.on('leave-journey', (journeyId) => {
      socket.leave(`journey-${journeyId}`);
      logger.info(`사용자 ${userId}가 여행 룸 ${journeyId}에서 나갔습니다`);
    });

    // 준비물 업데이트 이벤트
    socket.on('packing-item-update', (data) => {
      // 같은 여행의 다른 참가자들에게 업데이트 전송
      socket.to(`journey-${data.journeyId}`).emit('packing-item-updated', data);
      logger.info(`준비물 업데이트: ${data.itemId}`);
    });

    // 연결 해제 이벤트
    socket.on('disconnect', () => {
      logger.info(`사용자 연결 해제됨: ${userId}`);
    });
  });

  return io;
};

/**
 * 알림 이벤트 발송
 * @param {Object} io Socket.IO 인스턴스
 * @param {String} userId 수신자 ID
 * @param {Object} notification 알림 객체
 */
const sendNotification = (io, userId, notification) => {
  if (io) {
    io.to(`user-${userId}`).emit('notification', notification);
    logger.info(`알림 전송: ${notification._id} → ${userId}`);
  }
};

/**
 * 여행 참가자 변경 이벤트 발송
 * @param {Object} io Socket.IO 인스턴스
 * @param {String} journeyId 여행 ID
 * @param {Object} data 참가자 변경 데이터
 */
const sendParticipantUpdate = (io, journeyId, data) => {
  if (io) {
    io.to(`journey-${journeyId}`).emit('participant-update', data);
    logger.info(`참가자 업데이트: ${journeyId}`);
  }
};

/**
 * 준비물 업데이트 이벤트 발송
 * @param {Object} io Socket.IO 인스턴스
 * @param {String} journeyId 여행 ID
 * @param {Object} item 준비물 객체
 */
const sendPackingItemUpdate = (io, journeyId, item) => {
  if (io) {
    io.to(`journey-${journeyId}`).emit('packing-item-updated', item);
    logger.info(`준비물 업데이트 전송: ${item._id} → ${journeyId}`);
  }
};

module.exports = {
  setupSocketIO,
  sendNotification,
  sendParticipantUpdate,
  sendPackingItemUpdate
};