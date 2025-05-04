// src/controllers/journeyController.js
const Journey = require('../models/Journey');
const User = require('../models/User');
const Notification = require('../models/Notification');
const PackingItem = require('../models/PackingItem');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../config/logger');
const { getDestinationImage } = require('../utils/externalApiUtils');

/**
 * 사용자의 여행 목록 조회
 * @route GET /api/journeys
 * @access Private
 */
const getJourneys = async (req, res) => {
  try {
    // 사용자가 참여한 모든 여행 조회 (participants 배열에 사용자 ID가 포함된 여행)
    const journeys = await Journey.find({ participants: req.user._id })
      .populate('participants', 'email name profileImage socialType')
      .sort({ startDate: 1 }); // 시작일 기준 오름차순 정렬

    return sendSuccess(res, 200, '여행 목록을 성공적으로 조회했습니다', journeys);
  } catch (error) {
    logger.error(`여행 목록 조회 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 특정 여행 조회
 * @route GET /api/journeys/:id
 * @access Private
 */
const getJourneyById = async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id)
      .populate('participants', 'name profileImage')
      .populate('creatorId', 'name profileImage');

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 참여자 확인 (보안 검사)
    if (!journey.participants.some(participant => 
      participant._id.toString() === req.user._id.toString()
    )) {
      return sendError(res, 403, '이 여행에 접근할 권한이 없습니다');
    }

    return sendSuccess(res, 200, '여행 정보를 성공적으로 조회했습니다', journey);
  } catch (error) {
    logger.error(`여행 상세 조회 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 새로운 여행 생성
 * @route POST /api/journeys
 * @access Private
 */
const createJourney = async (req, res) => {
  try {
    const { 
      title, 
      transportType, 
      origin, 
      destination, 
      startDate, 
      endDate, 
      theme, 
      isPrivate = false 
    } = req.body;

    // 필수 필드 검증
    if (!title || !transportType || !origin || !destination || !startDate || !endDate || !theme) {
      return sendError(res, 400, '모든 필수 정보를 입력해주세요');
    }

    // 날짜 검증
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return sendError(res, 400, '종료 날짜는 시작 날짜 이후여야 합니다');
    }
    const imageData = await getDestinationImage(destination, theme);

    // 새 여행 생성
    const journey = await Journey.create({
      title,
      transportType,
      origin,
      destination,
      startDate: start,
      endDate: end,
      theme,
      isPrivate,
      creatorId: req.user._id,
      participants: [req.user._id], // 생성자를 참가자로 자동 추가
      imageUrl: imageData ? imageData.imageUrl : null // 이미지 URL 저장
    });

    const populatedJourney = await Journey.findById(journey._id)
      .populate('participants', 'email name profileImage socialType');

    return sendSuccess(res, 201, '여행이 성공적으로 생성되었습니다', populatedJourney);
  } catch (error) {
    logger.error(`여행 생성 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 여행 정보 업데이트
 * @route PUT /api/journeys/:id
 * @access Private
 */
const updateJourney = async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id);

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 권한 확인 (생성자만 수정 가능)
    if (journey.creatorId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, '여행 정보를 수정할 권한이 없습니다');
    }

    const { 
      title, 
      transportType, 
      origin, 
      destination, 
      startDate, 
      endDate, 
      theme, 
      isPrivate 
    } = req.body;

    // 날짜 검증
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < start) {
        return sendError(res, 400, '종료 날짜는 시작 날짜 이후여야 합니다');
      }
    }

    // 업데이트할 필드 설정
    if (title) journey.title = title;
    if (transportType) journey.transportType = transportType;
    if (origin) journey.origin = origin;
    if (destination) journey.destination = destination;
    if (startDate) journey.startDate = new Date(startDate);
    if (endDate) journey.endDate = new Date(endDate);
    if (theme) journey.theme = theme;
    if (isPrivate !== undefined) journey.isPrivate = isPrivate;

    // 저장
    await journey.save();

    return sendSuccess(res, 200, '여행 정보가 성공적으로 업데이트되었습니다', journey);
  } catch (error) {
    logger.error(`여행 업데이트 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 여행 삭제
 * @route DELETE /api/journeys/:id
 * @access Private
 */
const deleteJourney = async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id);

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 권한 확인 (생성자만 삭제 가능)
    if (journey.creatorId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, '여행을 삭제할 권한이 없습니다');
    }

    // 여행 삭제
    await journey.deleteOne();

    // 관련 알림 삭제 (Journey ID와 연결된 모든 알림)
    await Notification.deleteMany({ journeyId: req.params.id });

    // 여행 관련 준비물 삭제
    await PackingItem.deleteMany({ journeyId: req.params.id });

    return sendSuccess(res, 200, '여행이 성공적으로 삭제되었습니다');
  } catch (error) {
    logger.error(`여행 삭제 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 여행에 참가자 초대
 * @route POST /api/journeys/:id/participants
 * @access Private
 */
const inviteParticipant = async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id);

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 권한 확인 (여행 참가자만 초대 가능)
    if (!journey.participants.includes(req.user._id)) {
      return sendError(res, 403, '이 여행에 참가자를 초대할 권한이 없습니다');
    }

    // 혼자 여행인 경우 초대 불가
    if (journey.isPrivate) {
      return sendError(res, 400, '혼자 여행으로 설정된 여행에는 참가자를 초대할 수 없습니다');
    }

    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, '초대할 사용자의 이메일을 입력해주세요');
    }

    // 사용자 찾기
    const invitedUser = await User.findOne({ email });

    if (!invitedUser) {
      return sendError(res, 404, '해당 이메일을 가진 사용자를 찾을 수 없습니다');
    }

    // 자기 자신 초대 방지
    if (invitedUser._id.toString() === req.user._id.toString()) {
      return sendError(res, 400, '자기 자신을 초대할 수 없습니다');
    }

    // 이미 참가자인 경우 확인
    if (journey.participants.includes(invitedUser._id)) {
      return sendError(res, 400, '이미 여행에 참가 중인 사용자입니다');
    }

    // 초대 알림 생성
    const notification = await Notification.create({
      userId: invitedUser._id,
      journeyId: journey._id,
      type: 'invitation',
      content: `${req.user.name}님이 '${journey.title}' 여행에 초대했습니다.`
    });


    // 소켓을 통한 실시간 알림 전송 (추가)
    if (global.io) {
      sendNotification(global.io, invitedUser._id.toString(), notification);
    }
    
    // iOS 푸시 알림 전송 (추가)
    if (invitedUser.deviceToken && invitedUser.pushNotificationEnabled) {
      const title = '여행 초대';
      const content = `${req.user.name}님이 '${journey.title}' 여행에 초대했습니다.`;
      
      await sendPushToIOS(
        invitedUser.deviceToken,
        title,
        content,
        {
          notificationId: notification._id.toString(),
          journeyId: journey._id.toString(),
          type: 'invitation'
        }
      );
      
      logger.info(`여행 초대 푸시 알림 전송: ${invitedUser.name}에게`);
    }

    return sendSuccess(res, 200, '여행 초대가 성공적으로 전송되었습니다', { notification });
  } catch (error) {
    logger.error(`여행 참가자 초대 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 여행 참가자 제거
 * @route DELETE /api/journeys/:id/participants/:userId
 * @access Private
 */
const removeParticipant = async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id);

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    const userIdToRemove = req.params.userId;

    // 본인이 나가는 경우 또는 여행 생성자가 참가자 제거하는 경우 확인
    const isSelfRemoval = userIdToRemove === req.user._id.toString();
    const isCreator = journey.creatorId.toString() === req.user._id.toString();

    if (!isSelfRemoval && !isCreator) {
      return sendError(res, 403, '참가자를 제거할 권한이 없습니다');
    }

    // 생성자는 제거할 수 없음 (생성자가 나가면 여행 삭제 처리 필요)
    if (userIdToRemove === journey.creatorId.toString() && !isSelfRemoval) {
      return sendError(res, 400, '여행 생성자는 제거할 수 없습니다');
    }

    // 참가자 목록에서 제거
    if (!journey.participants.includes(userIdToRemove)) {
      return sendError(res, 400, '해당 사용자는 참가자 목록에 없습니다');
    }

    journey.participants = journey.participants.filter(
      id => id.toString() !== userIdToRemove
    );

    // 생성자가 나가는 경우 여행 삭제
    if (isSelfRemoval && isCreator) {
      await journey.deleteOne();
      // 관련 알림 및 패킹 아이템 삭제 로직 추가 필요
      return sendSuccess(res, 200, '여행이 성공적으로 삭제되었습니다');
    } else {
      await journey.save();
      return sendSuccess(res, 200, '참가자가 성공적으로 제거되었습니다');
    }
  } catch (error) {
    logger.error(`여행 참가자 제거 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 여행 초대 응답 (수락/거절)
 * @route PUT /api/journeys/invitations/:id
 * @access Private
 */
const respondToInvitation = async (req, res) => {
  try {
    const { accept } = req.body;
    
    if (accept === undefined) {
      return sendError(res, 400, '초대 응답(수락/거절)을 입력해주세요');
    }

    // 알림 찾기
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return sendError(res, 404, '초대를 찾을 수 없습니다');
    }

    // 권한 확인 (본인 알림만 응답 가능)
    if (notification.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, '이 초대에 응답할 권한이 없습니다');
    }

    // 타입 확인 (초대 알림만 응답 가능)
    if (notification.type !== 'invitation') {
      return sendError(res, 400, '유효한 초대 알림이 아닙니다');
    }

    // 여행 찾기
    const journey = await Journey.findById(notification.journeyId);

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 알림을 읽음 처리
    notification.isRead = true;
    await notification.save();

    // 수락한 경우 참가자 추가
    if (accept) {
      // 이미 참가자인 경우 확인
      if (!journey.participants.includes(req.user._id)) {
        journey.participants.push(req.user._id);
        await journey.save();
      }
      return sendSuccess(res, 200, '여행 초대를 수락했습니다');
    } else {
      return sendSuccess(res, 200, '여행 초대를 거절했습니다');
    }
  } catch (error) {
    logger.error(`여행 초대 응답 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 여행 테마별 추천 준비물 조회
 * @route GET /api/journeys/:id/recommendations
 * @access Private
 */
const getRecommendations = async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id)
    .populate('participants', 'email name profileImage socialType');
    
    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // // 참여자 확인 (보안 검사)
    // if (!journey.participants.includes(req.user._id)) {
    //   return sendError(res, 403, '이 여행에 접근할 권한이 없습니다');
    // }

    // 준비물 추천 서비스 호출
    const itemRecommendationService = require('../services/itemRecommendationService');
    const recommendedItems = await itemRecommendationService.getRecommendedItems(journey);

    // 결과 분류 (옷차림, 필수품 등으로 구분)
    const categories = {
      clothing: { name: '옷차림', items: [] },
      electronics: { name: '전자기기', items: [] },
      toiletries: { name: '세면용품', items: [] },
      documents: { name: '서류', items: [] },
      medicines: { name: '의약품', items: [] },
      essentials: { name: '필수품', items: [] },
      other: { name: '기타', items: [] }
    };

    // 카테고리별로 아이템 분류
    recommendedItems.forEach(item => {
      if (categories[item.category]) {
        categories[item.category].items.push(item);
      } else {
        categories.other.items.push(item);
      }
    });

    return sendSuccess(res, 200, '여행 정보에 맞는 추천 준비물 목록입니다', {
      journey: journey,
      categories: categories
    });
  } catch (error) {
    logger.error(`추천 준비물 조회 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

module.exports = {
  getJourneys,
  getJourneyById,
  createJourney,
  updateJourney,
  deleteJourney,
  inviteParticipant,
  removeParticipant,
  respondToInvitation,
  getRecommendations
};