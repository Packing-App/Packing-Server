// 날씨 예보 집계·범위 판정. 네트워크를 타지 않는 순수 함수만 다룬다.
//
// 배경: 예보 범위(무료 API 5일)를 넘는 날짜에 '현재 날씨'를 복제해 넣고 있었다.
// 1년 뒤 여행이면 모든 날짜가 오늘 값으로 같게 채워져 예보인 척했다(2026-08-01 운영 실측).
// 그리고 하루 중 3시간 슬롯 하나만 골라 그 슬롯의 temp_min/temp_max를 그대로 써서
// 최저/최고가 대표 기온과 같은 값으로 나왔다.
const {
  enumerateDates,
  summarizeDay,
  buildForecastRange
} = require('../externalApiUtils');

const OSAKA_OFFSET = 9 * 3600; // UTC+9 (city.timezone과 같은 초 단위)
const CITY = { name: 'Osaka', country: 'JP', timezone: OSAKA_OFFSET };

// 도시 현지 시각으로 슬롯을 만든다. dt는 UTC라 오프셋만큼 빼서 저장한다.
const slot = (localTime, { temp, min, max, rain, icon = '01d', main = 'Clear' } = {}) => ({
  dt: Date.parse(`${localTime}Z`) / 1000 - OSAKA_OFFSET,
  main: { temp, temp_min: min ?? temp, temp_max: max ?? temp, humidity: 60 },
  weather: [{ main, description: '맑음', icon }],
  wind: { speed: 3 },
  clouds: { all: 20 },
  ...(rain ? { rain: { '3h': rain } } : {})
});

const forecastWith = (slots) => ({ city: CITY, list: slots });

describe('enumerateDates', () => {
  it('시작일~종료일을 하루 단위로 편다', () => {
    expect(enumerateDates('2026-08-02', '2026-08-05')).toEqual([
      '2026-08-02',
      '2026-08-03',
      '2026-08-04',
      '2026-08-05'
    ]);
  });

  it('당일 여행이면 하루만 나온다', () => {
    expect(enumerateDates('2026-08-02', '2026-08-02')).toEqual(['2026-08-02']);
  });

  it('월 경계를 넘어간다', () => {
    expect(enumerateDates('2026-08-30', '2026-09-01')).toEqual([
      '2026-08-30',
      '2026-08-31',
      '2026-09-01'
    ]);
  });
});

describe('summarizeDay', () => {
  const slots = [
    slot('2026-08-02T06:00:00', { temp: 27, min: 26, max: 28, rain: 1.2 }),
    slot('2026-08-02T12:00:00', { temp: 33, min: 32, max: 34 }),
    slot('2026-08-02T21:00:00', { temp: 25, min: 24, max: 26, rain: 0.8 })
  ];

  it('최저/최고를 하루 전체 슬롯에서 뽑는다 (대표 슬롯 값이 아니다)', () => {
    const summary = summarizeDay(slots, CITY, OSAKA_OFFSET);

    expect(summary.tempMin).toBe(24);
    expect(summary.tempMax).toBe(34);
    // 예전 버그: 대표 슬롯의 min/max를 그대로 써서 셋 다 33이 됐다
    expect(summary.temp).toBe(33);
    expect(summary.tempMin).not.toBe(summary.temp);
  });

  it('대표 슬롯은 현지 12시에 가장 가까운 것', () => {
    expect(summarizeDay(slots, CITY, OSAKA_OFFSET).temp).toBe(33);
  });

  it('강수량은 하루 합계', () => {
    expect(summarizeDay(slots, CITY, OSAKA_OFFSET).rain).toBe(2);
  });

  it('예보 데이터임을 표시하고 도시 정보를 붙인다', () => {
    const summary = summarizeDay(slots, CITY, OSAKA_OFFSET);

    expect(summary.isForecast).toBe(true);
    expect(summary.cityName).toBe('Osaka');
    expect(summary.countryCode).toBe('JP');
  });

  it('슬롯이 없으면 null', () => {
    expect(summarizeDay([], CITY, OSAKA_OFFSET)).toBeNull();
    expect(summarizeDay(undefined, CITY, OSAKA_OFFSET)).toBeNull();
  });
});

describe('buildForecastRange', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-01T07:00:00Z')); // 오사카 현지 8/1 16:00
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const forecastData = forecastWith([
    slot('2026-08-02T12:00:00', { temp: 33, min: 30, max: 35 }),
    slot('2026-08-03T12:00:00', { temp: 29, min: 27, max: 30 })
  ]);

  it('예보가 있는 날짜는 집계값을 채운다', () => {
    const { forecasts } = buildForecastRange({
      forecastData,
      dates: ['2026-08-02', '2026-08-03']
    });

    expect(forecasts.map((f) => f.date)).toEqual(['2026-08-02', '2026-08-03']);
    expect(forecasts[0].weather.temp).toBe(33);
    expect(forecasts[1].weather.tempMax).toBe(30);
  });

  it('예보 범위를 넘는 날짜는 값을 지어내지 않는다 — 이게 이번 수정의 핵심', () => {
    const { forecasts, forecastAvailableUntil } = buildForecastRange({
      forecastData,
      dates: ['2026-08-02', '2027-08-01', '2027-08-02']
    });

    expect(forecastAvailableUntil).toBe('2026-08-03');

    const beyond = forecasts.filter((f) => f.date.startsWith('2027'));
    expect(beyond).toHaveLength(2);
    for (const day of beyond) {
      expect(day.weather).toBeNull();
      expect(day.error).toBe('FORECAST_OUT_OF_RANGE');
      expect(day.message).toContain('2026-08-03');
    }
  });

  it('범위 밖 날짜들이 서로 같은 값으로 복제되지 않는다', () => {
    const { forecasts } = buildForecastRange({
      forecastData,
      currentWeather: { temp: 36.08, weatherMain: 'Clouds' }, // 오늘 실측
      dates: ['2027-08-01', '2027-08-02', '2027-08-03']
    });

    // 예전에는 세 날짜 모두 현재 날씨(36.08)가 들어갔다
    expect(forecasts.every((f) => f.weather === null)).toBe(true);
  });

  it('여행 기간에 오늘이 들어 있으면 그날은 현재 날씨를 쓴다', () => {
    const today = forecastWith([
      slot('2026-08-01T12:00:00', { temp: 31, min: 30, max: 32 }),
      slot('2026-08-02T12:00:00', { temp: 33, min: 30, max: 35 })
    ]);

    const { forecasts } = buildForecastRange({
      forecastData: today,
      currentWeather: { temp: 36.08, weatherMain: 'Clouds' },
      dates: ['2026-08-01', '2026-08-02']
    });

    expect(forecasts[0].weather.temp).toBe(36.08); // 예보 슬롯(31)이 아니라 실측
    expect(forecasts[1].weather.temp).toBe(33);
  });

  it('예보 응답이 비어 있으면 전부 사유와 함께 null', () => {
    const { forecasts, forecastAvailableUntil } = buildForecastRange({
      forecastData: forecastWith([]),
      dates: ['2026-08-02']
    });

    expect(forecastAvailableUntil).toBeNull();
    expect(forecasts[0].weather).toBeNull();
    expect(forecasts[0].error).toBe('FORECAST_UNAVAILABLE');
  });

  it('예보 범위 안인데 슬롯이 빈 날짜는 범위 밖과 구분한다', () => {
    const gapped = forecastWith([
      slot('2026-08-02T12:00:00', { temp: 33 }),
      slot('2026-08-04T12:00:00', { temp: 30 })
    ]);

    const { forecasts } = buildForecastRange({
      forecastData: gapped,
      dates: ['2026-08-03', '2026-08-05']
    });

    expect(forecasts[0].error).toBe('FORECAST_UNAVAILABLE'); // 사이가 빈 날
    expect(forecasts[1].error).toBe('FORECAST_OUT_OF_RANGE'); // 마지막 날 이후
  });

  it('진행 중인 여행의 지난 날짜는 사유를 밝힌다', () => {
    const { forecasts } = buildForecastRange({
      forecastData,
      dates: ['2026-07-30', '2026-08-02'] // 오늘은 8/1
    });

    expect(forecasts[0].error).toBe('FORECAST_PAST');
    expect(forecasts[0].message).toBe('지난 날짜입니다');
    expect(forecasts[1].weather).not.toBeNull();
  });

  it('도시 현지 날짜로 묶는다 — UTC 기준으로 묶으면 하루가 밀린다', () => {
    // 오사카 현지 8/3 00:00 = UTC 8/2 15:00. UTC로 묶으면 8/2로 잘못 들어간다.
    const nearMidnight = forecastWith([slot('2026-08-03T00:00:00', { temp: 26 })]);

    const { forecasts } = buildForecastRange({
      forecastData: nearMidnight,
      dates: ['2026-08-03']
    });

    expect(forecasts[0].weather).not.toBeNull();
    expect(forecasts[0].weather.temp).toBe(26);
  });
});
