// SES 전송 계층 테스트.
// SendGrid에서 옮겨오면서 회귀가 날 만한 곳이 좁고 분명하다 — 한글 Charset, 발신 주소,
// 그리고 "절대 throw하지 않고 {success} 를 돌려준다"는 반환 계약. 그 세 가지만 본다.

const mockSendEmailPromise = jest.fn();
const mockSendEmail = jest.fn(() => ({ promise: mockSendEmailPromise }));

jest.mock('aws-sdk', () => ({
  SES: jest.fn(() => ({ sendEmail: mockSendEmail }))
}));

jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// SES 클라이언트를 모듈 로드 시점에 만들고 EMAIL_FROM도 호출 시점에 읽으므로,
// require 전에 환경변수를 세팅해야 한다 (jest에는 dotenv가 걸려 있지 않다).
process.env.EMAIL_FROM = 'no-reply@example.com';
process.env.AWS_REGION = 'ap-northeast-2';

const { sendEmail, sendVerificationCode, sendPasswordResetCode } = require('../emailService');

// 마지막 호출의 SES 파라미터
const lastParams = () => mockSendEmail.mock.calls[0][0];

beforeEach(() => {
  jest.clearAllMocks();
  mockSendEmailPromise.mockResolvedValue({ MessageId: 'test-message-id' });
});

describe('sendEmail', () => {
  test('SES 파라미터로 올바르게 매핑한다', async () => {
    await sendEmail('user@example.com', '제목', '텍스트 본문', '<p>HTML 본문</p>');

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const params = lastParams();

    expect(params.Source).toBe('no-reply@example.com');
    expect(params.Destination.ToAddresses).toEqual(['user@example.com']);
    expect(params.Message.Subject.Data).toBe('제목');
    expect(params.Message.Body.Text.Data).toBe('텍스트 본문');
    expect(params.Message.Body.Html.Data).toBe('<p>HTML 본문</p>');
  });

  test('제목과 본문 양쪽에 Charset UTF-8을 명시한다 (한글 깨짐 방지)', async () => {
    await sendEmail('user@example.com', '한글 제목', '한글 텍스트', '<p>한글 HTML</p>');

    const { Subject, Body } = lastParams().Message;
    expect(Subject.Charset).toBe('UTF-8');
    expect(Body.Text.Charset).toBe('UTF-8');
    expect(Body.Html.Charset).toBe('UTF-8');
  });

  test('성공하면 { success: true }', async () => {
    await expect(sendEmail('user@example.com', '제목', '텍스트', '<p>html</p>'))
      .resolves.toEqual({ success: true });
  });

  test('SES가 거부해도 throw하지 않고 { success: false, error }를 반환한다', async () => {
    mockSendEmailPromise.mockRejectedValue(new Error('Email address is not verified'));

    await expect(sendEmail('user@example.com', '제목', '텍스트', '<p>html</p>'))
      .resolves.toEqual({ success: false, error: 'Email address is not verified' });
  });
});

describe('sendVerificationCode', () => {
  test('한글 제목과 함께 인증번호를 텍스트·HTML 양쪽에 담는다', async () => {
    await sendVerificationCode('user@example.com', '홍길동', '123456');

    const { Subject, Body } = lastParams().Message;
    expect(Subject.Data).toBe('[PACKING] 이메일 인증번호를 확인해주세요');
    expect(Body.Text.Data).toContain('123456');
    expect(Body.Html.Data).toContain('123456');
    expect(Body.Text.Data).toContain('홍길동');
  });
});

describe('sendPasswordResetCode', () => {
  test('한글 제목과 함께 재설정 인증번호를 텍스트·HTML 양쪽에 담는다', async () => {
    await sendPasswordResetCode('user@example.com', '홍길동', '654321');

    const { Subject, Body } = lastParams().Message;
    expect(Subject.Data).toBe('[PACKING] 비밀번호 재설정 인증번호');
    expect(Body.Text.Data).toContain('654321');
    expect(Body.Html.Data).toContain('654321');
  });
});
