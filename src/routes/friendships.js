// src/routes/friendships.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { validateObjectIdParam } = require('../middlewares/validators');
const friendshipController = require('../controllers/friendshipController');

// :id가 ObjectId 형식이 아니면 컨트롤러 전에 400으로 끊는다
router.param('id', validateObjectIdParam);

// 친구 목록 조회
router.get('/', protect, friendshipController.getFriends);

// 친구 요청 목록 조회
router.get('/requests', protect, friendshipController.getFriendRequests);

// 친구 요청 보내기
router.post('/requests', protect, friendshipController.sendFriendRequest);

// 친구 요청 응답 (수락/거절)
router.put('/requests/:id', protect, friendshipController.respondToFriendRequest);

// 친구 삭제
router.delete('/:id', protect, friendshipController.removeFriend);

// 친구 코드로 사용자 검색
router.get('/search', protect, friendshipController.searchFriendByCode);

module.exports = router;