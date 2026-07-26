const { isValidObjectId, validateObjectIdParam } = require('../validators');

// sendError가 status/json을 부르므로 최소 목만 만든다
const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('isValidObjectId', () => {
  it('24자리 hex는 통과시킨다', () => {
    expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
    expect(isValidObjectId('507F1F77BCF86CD799439011')).toBe(true);
  });

  it('ObjectId 형식이 아닌 값은 거른다', () => {
    expect(isValidObjectId('profile')).toBe(false);
    expect(isValidObjectId('')).toBe(false);
    expect(isValidObjectId('507f1f77bcf86cd79943901')).toBe(false); // 23자
    expect(isValidObjectId('507f1f77bcf86cd7994390111')).toBe(false); // 25자
    expect(isValidObjectId('507f1f77bcf86cd79943901z')).toBe(false); // hex 아님
  });

  it('12글자 임의 문자열은 거른다 (mongoose isValid와 다른 점)', () => {
    expect(isValidObjectId('abcdefghijkl')).toBe(false);
  });
});

describe('validateObjectIdParam', () => {
  it('유효한 ID면 next로 넘긴다', () => {
    const res = mockRes();
    const next = jest.fn();

    validateObjectIdParam({}, res, next, '507f1f77bcf86cd799439011');

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('잘못된 형식이면 400으로 응답하고 next를 부르지 않는다', () => {
    const res = mockRes();
    const next = jest.fn();

    validateObjectIdParam({}, res, next, 'profile');

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: '잘못된 ID 형식입니다' })
    );
  });
});
