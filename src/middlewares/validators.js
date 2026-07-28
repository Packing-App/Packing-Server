// src/middlewares/validators.js
// 경로 파라미터 형식 검증. 잘못된 형식은 컨트롤러에 닿기 전에 400으로 끊는다.
const { sendError } = require('../utils/responseHelper');

// 24자리 hex만 허용한다.
// ⚠️ 원 커밋은 "mongoose의 isValidObjectId가 12글자 임의 문자열도 통과시킨다"를 근거로 들었지만
// 현재 버전(mongoose 8.12.2)에서는 사실이 아니다 — bson이 조여서 'abcdefghijkl'도 false다.
// 문자열 입력 6만 건을 비교했을 때 내장 함수와 결과가 100% 일치한다.
// 그래도 자체 정규식을 두는 이유는 mongoose 6 이하에서 실제로 있던 느슨함이 되돌아와도
// 이 검증이 흔들리지 않게 하기 위해서다. 동작이 아니라 버전 독립성이 근거다.
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const isValidObjectId = (value) => OBJECT_ID_PATTERN.test(String(value));

// Express router.param 콜백.
// ObjectId 형식이 아닌 값을 그대로 findById에 넘기면 Mongoose CastError가 나서 500이 되므로,
// 클라이언트 오류인 400으로 응답한다.
//
// ⚠️ router.param은 protect보다 먼저 돈다 — 미인증 + 잘못된 형식이면 401이 아니라 400이 나간다.
// 의도한 동작이다. 형식 오류는 인증 상태와 무관하고 리소스 존재 여부도 드러내지 않으므로
// 노출되는 정보가 없다. 순서를 뒤집으려면 라우트마다 protect 뒤에 검증을 끼워야 해서
// router.param 한 줄로 끝나는 이점이 사라진다.
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
