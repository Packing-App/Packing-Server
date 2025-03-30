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
 * 이메일 검증 메일 전송
 * @param {string} to 수신자 이메일
 * @param {string} name 사용자 이름
 * @param {string} token 검증 토큰
 * @returns {Promise} 이메일 전송 결과
 */

const sendVerificationEmail = async (to, name, token) => {
  const subject = '[PACKING]이메일 주소를 인증해주세요';
  
  // 웹사이트 주소
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  
  // 검증 링크
  const verificationLink = `${baseUrl}/auth/verify-email?token=${token}`;
  
  // 텍스트 버전
  const text = `안녕하세요 ${name}님, 회원가입을 완료하려면 다음 링크를 클릭하세요: ${verificationLink}`;
  
  // HTML 버전
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #4a6ee0;">이메일 주소 인증</h2>
      <p>안녕하세요 <strong>${name}</strong>님, PACKING 입니다.</p>
      <p>회원가입을 완료하려면 아래 버튼을 클릭하여 이메일 주소를 인증해주세요.</p>
      <div style="margin: 30px 0;">
        <a href="${verificationLink}" style="background-color: #4a6ee0; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">이메일 인증하기</a>
      </div>
      <p>이 링크는 24시간 동안만 유효합니다.</p>
    </div>
  `;
  
  return await sendEmail(to, subject, text, html);
};

/**
 * 비밀번호 재설정 메일 전송
 * @param {string} to 수신자 이메일
 * @param {string} name 사용자 이름
 * @param {string} token 재설정 토큰
 * @returns {Promise} 이메일 전송 결과
 */
const sendPasswordResetEmail = async (to, name, token) => {
  const subject = '[PACKING]비밀번호 재설정 요청';
  
  // 웹사이트 주소
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  
  // 재설정 링크
  const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;
  
  // 텍스트 버전
  const text = `안녕하세요 ${name}님, 비밀번호를 재설정하려면 다음 링크를 클릭하세요: ${resetLink}`;
  
  // HTML 버전
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #4a6ee0;">비밀번호 재설정</h2>
      <p>안녕하세요 <strong>${name}</strong>님, PACKING 입니다.</p>
      <p>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.</p>
      <div style="margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #4a6ee0; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">비밀번호 재설정</a>
      </div>
      <p>이 링크는 1시간 동안만 유효합니다.</p>
      <p>만약 비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시하셔도 됩니다.</p>
    </div>
  `;
  
  return await sendEmail(to, subject, text, html);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
};