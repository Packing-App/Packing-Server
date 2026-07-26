// src/middlewares/validators.js
// 경로 파라미터 형식 검증. 잘못된 형식은 컨트롤러에 닿기 전에 400으로 끊는다.
const { sendError } = require('../utils/responseHelper');

// mongoose의 isValidObjectId는 12글자짜리 임의 문자열도 통과시키므로
// 실제로 통용되는 24자리 hex만 허용한다.
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const isValidObjectId = (value) => OBJECT_ID_PATTERN.test(String(value));

// Express router.param 콜백.
// ObjectId 형식이 아닌 값을 그대로 findById에 넘기면 Mongoose CastError가 나서 500이 되므로,
// 클라이언트 오류인 400으로 응답한다.
const validateObjectIdParam = (req, res, next, value) => {
  if (!isValidObjectId(value)) {
    return sendError(res, 400, '잘못된 ID 형식입니다');
  }
  next();
};

module.exports = {
  isValidObjectId,
  validateObjectIdParam
};
