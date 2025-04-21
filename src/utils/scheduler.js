// src/utils/scheduler.js
const cron = require('node-cron');
const Journey = require('../models/Journey');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { getWeatherData, analyzeWeatherCondition } = require('./externalApiUtils');
const { sendNotification } = require('../socket/socketSetup');
const { sendPushToIOS } = require('../services/pushNotificationService');
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

  // 매주 월요일 오전 10시에 임박한 여행 알림 (한국 시간 기준)
  cron.schedule('0 10 * * 1', async () => {
    try {
      logger.info('주간 여행 알림 스케줄러 실행 중...');
      await scheduleWeeklyJourneyReminders();
    } catch (error) {
      logger.error(`주간 여행 알림 스케줄러 오류: ${error.message}`);
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
        // 알림 내용
        const title = '여행 준비 알림';
        const content = `'${journey.title}' 여행이 내일 시작합니다. 준비물을 확인해보세요!`;
        
        // 알림 생성
        const notification = await Notification.create({
          userId: participant._id,
          journeyId: journey._id,
          type: 'reminder',
          content: content,
          isRead: false
        });

        // 소켓을 통한 실시간 알림 전송
        if (global.io) {
          sendNotification(global.io, participant._id.toString(), notification);
        }
        
        // iOS 푸시 알림 전송 (추가)
        if (participant.deviceToken) {
          await sendPushToIOS(
            participant.deviceToken, 
            title, 
            content,
            { 
              notificationId: notification._id.toString(),
              journeyId: journey._id.toString(),
              type: 'reminder'
            }
          );
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
        
        if (!weatherData || weatherData.error) {
          logger.warn(`${journey.destination} 날씨 정보를 가져올 수 없습니다: ${weatherData?.error || '알 수 없는 오류'}`);
          continue;
        }

        // 날씨 상태 분석
        const condition = analyzeWeatherCondition(weatherData);
        
        // 특별한 날씨 상태인 경우만 알림 생성 (비, 눈, 매우 덥거나 추운 경우)
        if (condition === 'normal') {
          logger.info(`${journey.destination} 날씨가 정상 범위입니다. 알림 생성 건너뜀.`);
          continue;
        }

        // 알림 내용 설정
        let title = '날씨 알림';
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
          const fullContent = `${content} ${itemToRemind}`;
          const notification = await Notification.create({
            userId: participant._id,
            journeyId: journey._id,
            type: 'weather',
            content: fullContent,
            isRead: false
          });

          // 소켓을 통한 실시간 알림 전송
          if (global.io) {
            sendNotification(global.io, participant._id.toString(), notification);
          }
          
          // iOS 푸시 알림 전송
          if (participant.deviceToken) {
            await sendPushToIOS(
              participant.deviceToken, 
              title, 
              fullContent,
              { 
                notificationId: notification._id.toString(),
                journeyId: journey._id.toString(),
                type: 'weather',
                weatherCondition: condition
              }
            );
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

/**
 * 주간 여행 알림 스케줄링 (매주 월요일)
 */
const scheduleWeeklyJourneyReminders = async () => {
  try {
    // 이번 주에 시작하는 여행 찾기 (오늘부터 7일 이내)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    
    const upcomingJourneys = await Journey.find({
      startDate: {
        $gte: today,
        $lt: oneWeekLater
      }
    }).populate('participants');

    if (upcomingJourneys.length === 0) {
      logger.info('이번 주에 시작하는 여행이 없습니다.');
      return;
    }

    logger.info(`이번 주에 시작하는 여행 ${upcomingJourneys.length}개 찾음`);

    // 각 여행에 대해 알림 생성
    for (const journey of upcomingJourneys) {
      // 여행 시작까지 남은 일수 계산
      const daysUntil = Math.ceil((journey.startDate - today) / (1000 * 60 * 60 * 24));
      
      // 푸시 알림 활성화한 사용자에게만 알림 전송
      const eligibleParticipants = journey.participants.filter(
        participant => participant.pushNotificationEnabled
      );

      for (const participant of eligibleParticipants) {
        // 알림 내용
        const title = '이번 주 여행 알림';
        const content = `'${journey.title}' 여행이 ${daysUntil}일 후에 시작합니다. 준비 계획을 세워보세요!`;
        
        // 알림 생성
        const notification = await Notification.create({
          userId: participant._id,
          journeyId: journey._id,
          type: 'reminder',
          content: content,
          isRead: false
        });

        // 소켓을 통한 실시간 알림 전송
        if (global.io) {
          sendNotification(global.io, participant._id.toString(), notification);
        }
        
        // iOS 푸시 알림 전송
        if (participant.deviceToken) {
          await sendPushToIOS(
            participant.deviceToken, 
            title, 
            content,
            { 
              notificationId: notification._id.toString(),
              journeyId: journey._id.toString(),
              type: 'reminder',
              daysUntil: daysUntil
            }
          );
        }

        logger.info(`주간 여행 알림 생성: ${notification._id} → ${participant.name}`);
      }
    }
  } catch (error) {
    logger.error(`주간 여행 알림 스케줄링 오류: ${error.message}`);
    throw error;
  }
};

module.exports = {
  initSchedulers
};