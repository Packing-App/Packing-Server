// updatePackingItem의 공용 여부·담당자 판정만 다룬다.
// 레인 H P0(iOS 컨텍스트 메뉴)이 전적으로 이 분기에 얹혀 있는데 서버엔 테스트가 없었다.
// 특히 "담당자 미지정으로 되돌리기"는 iOS가 명시적 null을 보내야만 풀리므로
// (nil이면 키가 빠져 '변경 없음'이 된다) null과 키 누락을 구분하는 것이 핵심이다.
const mongoose = require('mongoose');

const PackingItem = require('../../models/PackingItem');
const Journey = require('../../models/Journey');
const { updatePackingItem } = require('../packingItemController');

const CREATOR = '507f1f77bcf86cd799439011';
const OTHER = '507f1f77bcf86cd799439012';
const STRANGER = '507f1f77bcf86cd799439099';
const ITEM_ID = '507f1f77bcf86cd799439055';
const JOURNEY_ID = '507f1f77bcf86cd799439077';

// 실제 mongoose 문서를 쓴다. participants.includes(문자열 id)가 통하는 것은
// mongoose 배열이 캐스팅해 비교해주기 때문이라(native Array였다면 false),
// 흉내낸 배열로 테스트하면 그 보장을 검증하지 못한다.
const makeJourney = (participants = [CREATOR, OTHER]) =>
  new Journey({
    _id: JOURNEY_ID,
    title: '테스트 여행',
    transportType: 'plane',
    origin: '서울',
    destination: '도쿄',
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-09-03'),
    themes: ['urban'],
    creatorId: CREATOR,
    participants
  });

const makeItem = ({ isShared = true, assignedTo = null, createdBy = CREATOR } = {}) => {
  const item = new PackingItem({
    _id: ITEM_ID,
    journeyId: JOURNEY_ID,
    name: '멀티탭',
    count: 1,
    category: 'electronics',
    isShared,
    assignedTo,
    createdBy
  });
  // DB에 나가지 않게 저장·populate만 막는다
  item.save = jest.fn().mockResolvedValue(item);
  item.populate = jest.fn().mockResolvedValue(item);
  return item;
};

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// body를 그대로 넘긴다. assignedTo 키를 아예 안 주는 경우와 null로 주는 경우를 구분해야 한다.
const run = async (body, { item, journey, userId = CREATOR } = {}) => {
  const packingItem = item || makeItem();
  jest.spyOn(PackingItem, 'findById').mockResolvedValue(packingItem);
  jest.spyOn(Journey, 'findById').mockResolvedValue(journey || makeJourney());

  const res = makeRes();
  await updatePackingItem(
    { params: { id: ITEM_ID }, body, user: { _id: new mongoose.Types.ObjectId(userId) } },
    res
  );
  return { res, packingItem, status: res.status.mock.calls[0][0], payload: res.json.mock.calls[0][0] };
};

const assignedId = (item) => (item.assignedTo ? item.assignedTo.toString() : item.assignedTo);

afterEach(() => {
  jest.restoreAllMocks();
});

describe('updatePackingItem — 담당자(assignedTo)', () => {
  it('명시적 null이면 담당자가 해제된다 (확인표 7번, iOS clearAssignedTo 경로)', async () => {
    const item = makeItem({ assignedTo: OTHER });

    const { status, packingItem } = await run({ assignedTo: null }, { item });

    expect(status).toBe(200);
    expect(assignedId(packingItem)).toBeNull();
    expect(packingItem.save).toHaveBeenCalled();
  });

  it('키 자체가 없으면 담당자는 그대로다 — 7번이 null을 보내야 하는 이유', async () => {
    const item = makeItem({ assignedTo: OTHER });

    const { status, packingItem } = await run({ name: '이름만 변경' }, { item });

    expect(status).toBe(200);
    expect(assignedId(packingItem)).toBe(OTHER);
    expect(packingItem.name).toBe('이름만 변경');
  });

  it('참가자 id를 주면 담당자로 지정된다 (확인표 6번)', async () => {
    const { status, packingItem } = await run({ assignedTo: OTHER });

    expect(status).toBe(200);
    expect(assignedId(packingItem)).toBe(OTHER);
  });

  it('참가자가 아닌 사람은 담당자로 지정할 수 없다', async () => {
    const { status, payload, packingItem } = await run({ assignedTo: STRANGER });

    expect(status).toBe(400);
    expect(payload.message).toBe('할당 대상은 여행 참가자여야 합니다');
    expect(packingItem.save).not.toHaveBeenCalled();
  });

  it('개인 준비물에는 담당자가 붙지 않는다', async () => {
    const item = makeItem({ isShared: false });

    const { status, packingItem } = await run({ assignedTo: OTHER }, { item });

    expect(status).toBe(200);
    expect(assignedId(packingItem)).toBeNull();
  });
});

describe('updatePackingItem — 공용 여부(isShared)', () => {
  it('개인으로 전환하면 담당자도 정리된다 (확인표 8번)', async () => {
    const item = makeItem({ assignedTo: OTHER });

    const { status, packingItem } = await run({ isShared: false }, { item });

    expect(status).toBe(200);
    expect(packingItem.isShared).toBe(false);
    expect(assignedId(packingItem)).toBeNull();
  });

  it('생성자가 아니면 isShared 변경이 조용히 무시된다 (확인표 9번의 근거)', async () => {
    const item = makeItem({ isShared: true, createdBy: CREATOR });

    // 참가자이지만 생성자는 아닌 사용자
    const { status, packingItem } = await run({ isShared: false }, { item, userId: OTHER });

    expect(status).toBe(200);
    expect(packingItem.isShared).toBe(true); // 에러가 아니라 무시다
  });

  it('생성자도 참가자도 아니면 403', async () => {
    const item = makeItem({ isShared: false, createdBy: CREATOR });

    const { status, payload } = await run({ name: '남의 개인 준비물' }, { item, userId: STRANGER });

    expect(status).toBe(403);
    expect(payload.message).toBe('이 준비물을 수정할 권한이 없습니다');
  });

  it('공용 준비물은 참가자 누구나 담당자를 바꿀 수 있다', async () => {
    const item = makeItem({ isShared: true, createdBy: CREATOR });

    const { status, packingItem } = await run({ assignedTo: OTHER }, { item, userId: OTHER });

    expect(status).toBe(200);
    expect(assignedId(packingItem)).toBe(OTHER);
  });
});
