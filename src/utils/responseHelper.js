// src/utils/responseHelper.js

/**
 * 표준화된 성공 응답을 생성합니다.
 * @param {Object} res - Express response 객체
 * @param {number} statusCode - HTTP 상태 코드
 * @param {string} message - 성공 메시지
 * @param {Object} data - 응답 데이터
 */
const sendSuccess = (res, statusCode, message, data = null) => {
    const response = {
      success: true,
      message
    };
    
    if (data) {
      response.data = data;
    }
    
    return res.status(statusCode).json(response);
  };
  
  /**
   * 표준화된 오류 응답을 생성합니다.
   * @param {Object} res - Express response 객체
   * @param {number} statusCode - HTTP 상태 코드
   * @param {string} message - 오류 메시지
   * @param {Object} errors - 상세 오류 정보 (선택 사항)
   */
  const sendError = (res, statusCode, message, errors = null) => {
    const response = {
      success: false,
      message
    };
    
    if (errors) {
      response.errors = errors;
    }
    
    return res.status(statusCode).json(response);
  };
  
  module.exports = {
    sendSuccess,
    sendError
  };