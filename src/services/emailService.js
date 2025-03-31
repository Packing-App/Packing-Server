// src/services/emailService.js
const sgMail = require('@sendgrid/mail');
const logger = require('../config/logger');

// SendGrid API 키 설정
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * 이메일 전송 함수
 * @param {string} to 수신자 이메일
 * @param {string} subject 이메일 제목
 * @param {string} text 텍스트 형식 내용
 * @param {string} html HTML 형식 내용
 * @returns {Promise} 이메일 전송 결과
 */

const sendEmail = async (to, subject, text, html) => {
  try {
    const msg = {
      to,
      from: process.env.EMAIL_FROM, // 발신자 이메일 (SendGrid에서 인증된 주소)
      subject,
      text,
      html
    };

    await sgMail.send(msg);
    logger.info(`Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error(`Email sending error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * 이메일 인증번호 전송
 * @param {string} to 수신자 이메일
 * @param {string} name 사용자 이름
 * @param {string} verificationCode 인증번호
 * @returns {Promise} 이메일 전송 결과
 */
const sendVerificationCode = async (to, name, verificationCode) => {
  const subject = '[PACKING] 이메일 인증번호를 확인해주세요';
  
  // 텍스트 버전
  const text = `안녕하세요 ${name}님, 회원가입을 완료하려면 다음 인증번호를 입력해주세요: ${verificationCode}`;
  
  // HTML 버전
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #4a6ee0;">이메일 인증번호</h2>
      <p>안녕하세요 <strong>${name}</strong>님, PACKING 입니다.</p>
      <p>회원가입을 완료하려면 아래 인증번호를 입력해주세요.</p>
      <div style="margin: 30px 0; text-align: center;">
        <div style="font-size: 24px; letter-spacing: 5px; font-weight: bold; background-color: #f5f5f5; padding: 15px; border-radius: 4px;">
          ${verificationCode}
        </div>
      </div>
      <p>이 인증번호는 30분 동안만 유효합니다.</p>
    </div>
  `;
  
  return await sendEmail(to, subject, text, html);
};

/**
 * 비밀번호 재설정 인증번호 전송
 * @param {string} to 수신자 이메일
 * @param {string} name 사용자 이름
 * @param {string} resetCode 재설정 인증번호
 * @returns {Promise} 이메일 전송 결과
 */
const sendPasswordResetCode = async (to, name, resetCode) => {
  const subject = '[PACKING] 비밀번호 재설정 인증번호';
  
  // 텍스트 버전
  const text = `안녕하세요 ${name}님, 비밀번호를 재설정하려면 다음 인증번호를 입력해주세요: ${resetCode}`;
  
  // HTML 버전
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #4a6ee0;">비밀번호 재설정 인증번호</h2>
      <p>안녕하세요 <strong>${name}</strong>님, PACKING 입니다.</p>
      <p>비밀번호 재설정을 위한 인증번호는 다음과 같습니다.</p>
      <div style="margin: 30px 0; text-align: center;">
        <div style="font-size: 24px; letter-spacing: 5px; font-weight: bold; background-color: #f5f5f5; padding: 15px; border-radius: 4px;">
          ${resetCode}
        </div>
      </div>
      <p>이 인증번호는 30분 동안만 유효합니다.</p>
      <p>만약 비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시하셔도 됩니다.</p>
    </div>
  `;
  
  return await sendEmail(to, subject, text, html);
};

module.exports = {
  sendEmail,
  sendVerificationCode,
  sendPasswordResetCode
};