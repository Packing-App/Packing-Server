// src/controllers/friendshipController.js
const Friendship = require('../models/Friendship');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../config/logger');
const { sendNotification } = require('../socket/socketSetup');
const { sendPushToIOS } = require('../services/pushNotificationService');

/**
 * 친구 목록 조회
 * @route GET /api/friendships
 * @access Private
 */
const getFriends = async (req, res) => {
  try {
    // 수락된 친구 관계만 조회
    const sentFriendships = await Friendship.find({ 
      requesterId: req.user._id,
      status: 'accepted'
    }).populate('receiverId', 'name email profileImage intro');

    const receivedFriendships = await Friendship.find({ 
      receiverId: req.user._id,
      status: 'accepted'
    }).populate('requesterId', 'name email profileImage intro');

    // 친구 목록 통합
    const friends = [
      ...sentFriendships.map(f => ({
        _id: f.receiverId._id,
        name: f.receiverId.name,
        email: f.receiverId.email,
        profileImage: f.receiverId.profileImage,
        intro: f.receiverId.intro,
        friendshipId: f._id
      })),
      ...receivedFriendships.map(f => ({
        _id: f.requesterId._id,
        name: f.requesterId.name,
        email: f.requesterId.email,
        profileImage: f.requesterId.profileImage,
        intro: f.requesterId.intro,
        friendshipId: f._id
      }))
    ];

    return sendSuccess(res, 200, '친구 목록을 성공적으로 조회했습니다', friends);
  } catch (error) {
    logger.error(`친구 목록 조회 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 친구 요청 목록 조회
 * @route GET /api/friendships/requests
 * @access Private
 */
const getFriendRequests = async (req, res) => {
  try {
    // 받은 친구 요청 (대기 중인 요청만)
    const receivedRequests = await Friendship.find({ 
      receiverId: req.user._id,
      status: 'pending'
    }).populate('requesterId', 'name email profileImage')
      .sort({ createdAt: -1 });

    // 보낸 친구 요청 (대기 중인 요청만)
    const sentRequests = await Friendship.find({ 
      requesterId: req.user._id,
      status: 'pending'
    }).populate('receiverId', 'name email profileImage')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, '친구 요청 목록을 성공적으로 조회했습니다', {
      received: receivedRequests,
      sent: sentRequests
    });
  } catch (error) {
    logger.error(`친구 요청 목록 조회 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 친구 요청 보내기
 * @route POST /api/friendships/requests
 * @access Private
 */
const sendFriendRequest = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, '친구 요청을 보낼 사용자의 이메일을 입력해주세요');
    }

    // 이메일로 사용자 찾기
    const receiver = await User.findOne({ email });

    if (!receiver) {
      return sendError(res, 404, '해당 이메일을 가진 사용자를 찾을 수 없습니다');
    }

    // 자기 자신에게 요청 방지
    if (receiver._id.toString() === req.user._id.toString()) {
      return sendError(res, 400, '자기 자신에게 친구 요청을 보낼 수 없습니다');
    }

    // 이미 친구인지 확인
    const existingFriendship = await Friendship.findOne({
      $or: [
        { requesterId: req.user._id, receiverId: receiver._id },
        { requesterId: receiver._id, receiverId: req.user._id }
      ]
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return sendError(res, 400, '이미 친구 관계입니다');
      } else if (existingFriendship.status === 'pending') {
        if (existingFriendship.requesterId.toString() === req.user._id.toString()) {
          return sendError(res, 400, '이미 친구 요청을 보냈습니다');
        } else {
          return sendError(res, 400, '해당 사용자가 이미 친구 요청을 보냈습니다. 요청을 수락해주세요.');
        }
      } else if (existingFriendship.status === 'rejected') {
        // 거절된 친구 요청이 있을 경우, 이를 삭제하고 새로운 요청 생성
        await existingFriendship.deleteOne();
      }
    }

    // 새 친구 요청 생성
    const friendship = await Friendship.create({
      requesterId: req.user._id,
      receiverId: receiver._id,
      status: 'pending'
    });
    
    // 알림 생성
    const notification = await Notification.create({
      userId: receiver._id,
      type: 'friendRequest',
      content: `${req.user.name}님이 친구 요청을 보냈습니다.`,
      // 친구 요청 ID를 메타데이터로 저장하여 나중에 알림 읽음 처리 시 사용
      metadata: {
        friendshipId: friendship._id.toString()
      }
    });

    // 소켓을 통한 실시간 알림 전송
    if (global.io) {
      sendNotification(global.io, receiver._id.toString(), notification);
    }

    // iOS 푸시 알림 전송
    if (receiver.deviceToken && receiver.pushNotificationEnabled) {
      const title = '친구 요청';
      const content = `${req.user.name}님이 친구 요청을 보냈습니다.`;
      
      await sendPushToIOS(
        receiver.deviceToken,
        title,
        content,
        {
          notificationId: notification._id.toString(),
          type: 'friendRequest',
          friendshipId: friendship._id.toString() // 친구 요청 ID도 함께 전송
        }
      );
      
      logger.info(`친구 요청 푸시 알림 전송: ${receiver.name}에게`);
    }

    return sendSuccess(res, 201, '친구 요청을 성공적으로 보냈습니다', friendship);
  } catch (error) {
    logger.error(`친구 요청 보내기 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 친구 요청 응답 (수락/거절)
 * @route PUT /api/friendships/requests/:id
 * @access Private
 */
const respondToFriendRequest = async (req, res) => {
  try {
    const { accept } = req.body;
    
    if (accept === undefined) {
      return sendError(res, 400, '요청 응답(수락/거절)을 입력해주세요');
    }

    // 친구 요청 찾기
    const friendship = await Friendship.findById(req.params.id);

    if (!friendship) {
      return sendError(res, 404, '친구 요청을 찾을 수 없습니다');
    }

    // 권한 확인 (수신자만 응답 가능)
    if (friendship.receiverId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, '이 친구 요청에 응답할 권한이 없습니다');
    }

    // 이미 처리된 요청 확인
    if (friendship.status !== 'pending') {
      return sendError(res, 400, '이미 처리된 친구 요청입니다');
    }

    // 상태 업데이트
    friendship.status = accept ? 'accepted' : 'rejected';
    await friendship.save();

    // 관련 알림 찾기 (친구 요청 관련 알림)
    try {
      // 친구 요청과 관련된 알림 찾기 (여러 방법으로 시도)
      // 1. metadata.friendshipId로 찾기 (새로운 방식)
      let friendRequestNotification = await Notification.findOne({
        userId: req.user._id,
        type:  'friendRequest',
        'metadata.friendshipId': friendship._id.toString(),
        isRead: false
      });
      
      // 2. 메타데이터가 없는 경우, 내용으로 검색 (기존 알림)
      if (!friendRequestNotification) {
        // 친구 요청자 정보 가져오기
        const requester = await User.findById(friendship.requesterId);
        if (requester) {
          friendRequestNotification = await Notification.findOne({
            userId: req.user._id,
            type: 'friendRequest',
            content: new RegExp(`${requester.name}.*친구 요청`, 'i'),
            isRead: false
          });
        }
      }
      
      // 관련 알림을 찾았다면 읽음 처리
      if (friendRequestNotification) {
        friendRequestNotification.isRead = true;
        await friendRequestNotification.save();
        logger.info(`친구 요청 관련 알림 읽음 처리: ${friendRequestNotification._id}`);
      }
    } catch (notificationError) {
      // 알림 처리 실패는 전체 응답 실패로 이어지지 않도록 로그만 남김
      logger.error(`친구 요청 관련 알림 처리 오류: ${notificationError.message}`);
    }

    // 친구 요청 수락 시 상대방에게 알림 생성
    if (accept) {
      // 알림 생성 결과를 변수에 저장
      const notification = await Notification.create({
        userId: friendship.requesterId,
        type: 'friendRequestResponse',
        content: `${req.user.name}님이 친구 요청을 수락했습니다.`,
        // 친구 관계 ID 저장
        metadata: {
          friendshipId: friendship._id.toString()
        }
      });

      // 소켓을 통한 실시간 알림 전송
      if (global.io) {
        sendNotification(global.io, friendship.requesterId.toString(), notification);
      }

      // iOS 푸시 알림 전송
      const requester = await User.findById(friendship.requesterId);
      if (requester && requester.deviceToken && requester.pushNotificationEnabled) {
        const title = '친구 요청 수락';
        const content = `${req.user.name}님이 친구 요청을 수락했습니다.`;
        
        try {
          await sendPushToIOS(
            requester.deviceToken,
            title,
            content,
            {
              notificationId: notification._id.toString(),
              type: 'friendRequestResponse',
              friendshipId: friendship._id.toString()
            }
          );
          
          logger.info(`친구 요청 수락 푸시 알림 전송: ${requester.name}에게`);
        } catch (pushError) {
          // 푸시 전송 실패해도 API 응답에는 영향 없도록 처리
          logger.error(`푸시 알림 전송 오류: ${pushError.message}`);
        }
      }
    }

    return sendSuccess(
      res, 
      200, 
      accept ? '친구 요청을 수락했습니다' : '친구 요청을 거절했습니다'
    );
  } catch (error) {
    logger.error(`친구 요청 응답 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 친구 삭제
 * @route DELETE /api/friendships/:id
 * @access Private
 */
const removeFriend = async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.id);

    if (!friendship) {
      return sendError(res, 404, '친구 관계를 찾을 수 없습니다');
    }

    // 권한 확인 (요청자 또는 수신자만 삭제 가능)
    if (
      friendship.requesterId.toString() !== req.user._id.toString() && 
      friendship.receiverId.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 403, '이 친구 관계를 삭제할 권한이 없습니다');
    }

    // 친구 관계 삭제
    await friendship.deleteOne();

    return sendSuccess(res, 200, '친구 관계가 성공적으로 삭제되었습니다');
  } catch (error) {
    logger.error(`친구 삭제 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 이메일로 친구 검색
 * @route GET /api/friendships/search
 * @access Private
 */
const searchFriendByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return sendError(res, 400, '검색할 이메일을 입력해주세요');
    }

    // 이메일로 사용자 찾기 (부분 일치 검색)
    const users = await User.find({ 
      email: { $regex: email, $options: 'i' },
      _id: { $ne: req.user._id } // 자기 자신 제외
    }).select('name email profileImage');

    // if (!users.length) {
    //   return sendError(res, 404, '해당 이메일을 가진 사용자를 찾을 수 없습니다');
    // }

    // 기존 친구 관계 확인
    const friendshipStatuses = await Promise.all(
      users.map(async (user) => {
        const friendship = await Friendship.findOne({
          $or: [
            { requesterId: req.user._id, receiverId: user._id },
            { requesterId: user._id, receiverId: req.user._id }
          ]
        });

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
          friendshipStatus: friendship ? friendship.status : null,
          friendshipId: friendship ? friendship._id : null
        };
      })
    );

    return sendSuccess(res, 200, '사용자 검색 결과입니다', friendshipStatuses);
  } catch (error) {
    logger.error(`친구 검색 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

module.exports = {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  searchFriendByEmail
};