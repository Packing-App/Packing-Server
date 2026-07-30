jest.mock('../../models/Journey');

const Journey = require('../../models/Journey');
const { canAccessJourneyRoom } = require('../socketSetup');

const USER_ID = '507f1f77bcf86cd799439011';
const OTHER_USER_ID = '507f1f77bcf86cd799439012';
const JOURNEY_ID = '507f1f77bcf86cd799439099';

describe('canAccessJourneyRoom', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('참가자면 true', async () => {
    Journey.findById.mockResolvedValue({ participants: [USER_ID, OTHER_USER_ID] });

    await expect(canAccessJourneyRoom(JOURNEY_ID, USER_ID)).resolves.toBe(true);
  });

  it('참가자가 아니면 false — 이게 버그의 핵심이었다', async () => {
    Journey.findById.mockResolvedValue({ participants: [OTHER_USER_ID] });

    await expect(canAccessJourneyRoom(JOURNEY_ID, USER_ID)).resolves.toBe(false);
  });

  it('존재하지 않는 여행이면 false', async () => {
    Journey.findById.mockResolvedValue(null);

    await expect(canAccessJourneyRoom(JOURNEY_ID, USER_ID)).resolves.toBe(false);
  });

  it('journeyId 형식이 아니면 DB 조회 없이 false', async () => {
    await expect(canAccessJourneyRoom('not-an-object-id', USER_ID)).resolves.toBe(false);
    expect(Journey.findById).not.toHaveBeenCalled();
  });

  it('journeyId가 없으면 DB 조회 없이 false (packing-item-update의 data.journeyId 누락 대비)', async () => {
    await expect(canAccessJourneyRoom(undefined, USER_ID)).resolves.toBe(false);
    expect(Journey.findById).not.toHaveBeenCalled();
  });

  it('participants가 populate된 문서 배열이어도 안전하게 비교한다', async () => {
    Journey.findById.mockResolvedValue({
      participants: [{ _id: USER_ID }, { _id: OTHER_USER_ID }]
    });

    await expect(canAccessJourneyRoom(JOURNEY_ID, USER_ID)).resolves.toBe(true);
  });
});
