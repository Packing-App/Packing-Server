// src/utils/scheduler.js
const cron = require('node-cron');
const Journey = require('../models/Journey');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { getWeatherData, analyzeWeatherCondition } = require('./externalApiUtils');
const { sendNotification } = require('../socket/socketSetup');
const logger = require('../config/logger');

/**
 * 알림 스케줄러 초기화
 */
const initSchedulers = () => {
  // 매일 오전 9시에 여행 전날 알림 확인 (한국 시간 기준)
  cron.schedule('0 9 * * *', async () => {
    try {
      logger.info('여행 전날 알림 스케줄러 실행 중...');
      await scheduleJourneyReminders();
    } catch (error) {
      logger.error(`여행 알림 스케줄러 오류: ${error.message}`);
    }
  });

  // 매일 오전 8시에 여행 날씨 알림 확인 (한국 시간 기준)
  cron.schedule('0 8 * * *', async () => {
    try {
      logger.info('날씨 알림 스케줄러 실행 중...');
      await scheduleWeatherAlerts();
    } catch (error) {
      logger.error(`날씨 알림 스케줄러 오류: ${error.message}`);
    }
  });

  logger.info('알림 스케줄러가 초기화되었습니다.');
};

/**
 * 여행 전날 알림 스케줄링
 */
const scheduleJourneyReminders = async () => {
  try {
    // 내일 시작하는 여행 찾기
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(tomorrow);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const upcomingJourneys = await Journey.find({
      startDate: {
        $gte: tomorrow,
        $lt: nextDay
      }
    }).populate('participants');

    if (upcomingJourneys.length === 0) {
      logger.info('내일 시작하는 여행이 없습니다.');
      return;
    }

    logger.info(`내일 시작하는 여행 ${upcomingJourneys.length}개 찾음`);

    // 각 여행에 대해 알림 생성
    for (const journey of upcomingJourneys) {
      // 푸시 알림 활성화한 사용자에게만 알림 전송
      const eligibleParticipants = journey.participants.filter(
        participant => participant.pushNotificationEnabled
      );

      for (const participant of eligibleParticipants) {
        // 알림 생성
        const notification = await Notification.create({
          userId: participant._id,
          journeyId: journey._id,
          type: 'reminder',
          content: `'${journey.title}' 여행 하루 전입니다. 준비물을 확인해보세요!`,
          isRead: false
        });

        // 소켓을 통한 실시간 알림 전송
        if (global.io) {
          sendNotification(global.io, participant._id.toString(), notification);
        }

        logger.info(`여행 알림 생성: ${notification._id} → ${participant.name}`);
      }
    }
  } catch (error) {
    logger.error(`여행 알림 스케줄링 오류: ${error.message}`);
    throw error;
  }
};

/**
 * 날씨 알림 스케줄링
 */
const scheduleWeatherAlerts = async () => {
  try {
    // 오늘부터 3일 내에 시작하는 여행 찾기
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    
    const upcomingJourneys = await Journey.find({
      startDate: {
        $gte: today,
        $lt: threeDaysLater
      }
    }).populate('participants');

    if (upcomingJourneys.length === 0) {
      logger.info('3일 내에 시작하는 여행이 없습니다.');
      return;
    }

    logger.info(`3일 내에 시작하는 여행 ${upcomingJourneys.length}개 찾음`);

    // 각 여행에 대해 날씨 확인 및 알림 생성
    for (const journey of upcomingJourneys) {
      try {
        // 여행지 날씨 조회
        const weatherData = await getWeatherData(journey.destination, null, journey.startDate);
        
        if (!weatherData) {
          logger.warn(`${journey.destination} 날씨 정보를 가져올 수 없습니다.`);
          continue;
        }

        // 날씨 상태 분석
        const condition = analyzeWeatherCondition(weatherData);
        
        // 특별한 날씨 상태인 경우만 알림 생성 (비, 눈, 매우 덥거나 추운 경우)
        if (condition === 'normal') {
          continue;
        }

        // 알림 내용 설정
        let content = '';
        let itemToRemind = '';

        switch (condition) {
          case 'rain':
            content = `'${journey.title}' 여행지의 날씨에 비가 예보되어 있습니다.`;
            itemToRemind = '우산을 준비하세요!';
            break;
          case 'snow':
            content = `'${journey.title}' 여행지의 날씨에 눈이 예보되어 있습니다.`;
            itemToRemind = '방한 준비를 해주세요!';
            break;
          case 'hot':
            content = `'${journey.title}' 여행지의 날씨가 매우 덥습니다.`;
            itemToRemind = '자외선 차단제와 물을 챙기세요!';
            break;
          case 'cold':
            content = `'${journey.title}' 여행지의 날씨가 매우 춥습니다.`;
            itemToRemind = '따뜻한 옷을 준비하세요!';
            break;
        }

        // 푸시 알림 활성화한 사용자에게만 알림 전송
        const eligibleParticipants = journey.participants.filter(
          participant => participant.pushNotificationEnabled
        );

        for (const participant of eligibleParticipants) {
          // 알림 생성
          const notification = await Notification.create({
            userId: participant._id,
            journeyId: journey._id,
            type: 'weather',
            content: `${content} ${itemToRemind}`,
            isRead: false
          });

          // 소켓을 통한 실시간 알림 전송
          if (global.io) {
            sendNotification(global.io, participant._id.toString(), notification);
          }

          logger.info(`날씨 알림 생성: ${notification._id} → ${participant.name}`);
        }
      } catch (error) {
        logger.error(`여행 ${journey.title} 날씨 알림 오류: ${error.message}`);
        // 한 여행의 오류가 다른 여행 처리를 방해하지 않도록 계속 진행
        continue;
      }
    }
  } catch (error) {
    logger.error(`날씨 알림 스케줄링 오류: ${error.message}`);
    throw error;
  }
};

module.exports = {
  initSchedulers
};