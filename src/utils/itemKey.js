// src/utils/itemKey.js
const { itemCatalog } = require('../data/itemCatalog');

/**
 * 표기 흔들림 흡수용 정규화. 공백 제거 + 소문자 + NFC 통일.
 *
 * 슬래시는 건드리지 않는다 — '여권/신분증'을 어느 항목으로 접을지는 알고리즘이
 * 정할 수 없다. 그런 복합어는 카탈로그에서 사람이 별칭으로 등록한다.
 * NFC는 iOS 자유 입력으로 넘어오는 자모 분리(NFD) 한글을 흡수하기 위한 것이다.
 *
 * @param {*} raw 준비물 이름 (문자열이 아니어도 안전)
 * @returns {string} 정규화된 문자열
 */
const normalizeItemName = (raw) =>
  String(raw ?? '')
    .normalize('NFC')
    .replace(/\s+/g, '')
    .toLowerCase();

// 정규화된 이름(정본·별칭 모두) → 정본 이름. 모듈 로드 시 1회만 만든다.
// 무결성 위반(별칭 중복 등)을 여기서 throw하지 않는다 — 오타 하나로 서버가 죽는다.
// 검증은 src/data/__tests__/itemCatalog.test.js가 맡는다.
const canonicalNameByNormalized = new Map();

Object.entries(itemCatalog).forEach(([canonicalName, entry]) => {
  canonicalNameByNormalized.set(normalizeItemName(canonicalName), canonicalName);
  (entry.aliases || []).forEach((alias) => {
    canonicalNameByNormalized.set(normalizeItemName(alias), canonicalName);
  });
});

/**
 * 준비물 이름을 카탈로그 정본으로 해석한다.
 * 카탈로그에 없으면 원본을 그대로 돌려준다(locationUtils의 translateCityName과 같은 폴백 스타일).
 *
 * @param {*} rawName 준비물 이름
 * @returns {{key: string, name: string, category: string|null}}
 *   key      중복 병합용 식별자. 같은 물건이면 같은 값이 나온다
 *   name     화면에 보일 이름. 미등록이면 원본을 유지한다(정규화된 문자열을 보여주면 안 된다)
 *   category 정본 카테고리. 미등록이면 null이라 호출부가 원본 카테고리를 유지할 수 있다
 */
const resolveItem = (rawName) => {
  const normalized = normalizeItemName(rawName);
  const canonicalName = canonicalNameByNormalized.get(normalized);

  if (!canonicalName) {
    return {
      key: normalized,
      name: String(rawName ?? '').trim(),
      category: null
    };
  }

  return {
    key: normalizeItemName(canonicalName),
    name: canonicalName,
    category: itemCatalog[canonicalName].category
  };
};

module.exports = {
  resolveItem,
  // 카탈로그 무결성 테스트에서 쓴다
  normalizeItemName
};
