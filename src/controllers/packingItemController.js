// src/controllers/packingItemController.js
const PackingItem = require('../models/PackingItem');
const Journey = require('../models/Journey');
const ThemeTemplate = require('../models/ThemeTemplate');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../config/logger');

/**
 * 여행별 준비물 목록 조회
 * @route GET /api/packing-items/journey/:journeyId
 * @access Private
 */
const getPackingItemsByJourney = async (req, res) => {
  try {
    const { journeyId } = req.params;

    // 여행 정보 조회
    const journey = await Journey.findById(journeyId);

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 권한 확인 (참가자만 조회 가능)
    if (!journey.participants.includes(req.user._id)) {
      return sendError(res, 403, '이 여행의 준비물을 조회할 권한이 없습니다');
    }

    // 준비물 조회 (공유 준비물 + 내 개인 준비물)
    const packingItems = await PackingItem.find({
      journeyId,
      $or: [
        { isShared: true },
        { isShared: false, createdBy: req.user._id }
      ]
    }).populate('assignedTo', 'name profileImage')
      .populate('createdBy', 'name profileImage')
      .sort({ category: 1, name: 1 });

    return sendSuccess(res, 200, '준비물 목록을 성공적으로 조회했습니다', packingItems);
  } catch (error) {
    logger.error(`준비물 목록 조회 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 준비물 생성
 * @route POST /api/packing-items
 * @access Private
 */
const createPackingItem = async (req, res) => {
  try {
    const { journeyId, name, count, category, isShared, assignedTo, mergeDuplicates = true } = req.body;

    if (!journeyId || !name || !category) {
      return sendError(res, 400, '모든 필수 정보를 입력해주세요');
    }

    // 여행 정보 조회
    const journey = await Journey.findById(journeyId);

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 권한 확인 (참가자만 생성 가능)
    if (!journey.participants.includes(req.user._id)) {
      return sendError(res, 403, '이 여행의 준비물을 생성할 권한이 없습니다');
    }

    // 할당 대상이 있는 경우 참가자 확인
    if (assignedTo && !journey.participants.includes(assignedTo)) {
      return sendError(res, 400, '할당 대상은 여행 참가자여야 합니다');
    }

    // 이름이 같은 아이템이 이미 있는지 확인 (생성자가 같고, 공유 상태가 같은 경우)
    if (mergeDuplicates) {
      const existingItem = await PackingItem.findOne({
        journeyId,
        name,
        isShared: isShared || false,
        createdBy: req.user._id,
        // 할당된 사용자가 같거나 둘 다 없는 경우만 병합
        ...(isShared ? { assignedTo: assignedTo || null } : {})
      });

      // 이미 있으면 count만 증가
      if (existingItem) {
        existingItem.count += (count || 1);
        await existingItem.save();
        
        await existingItem.populate('assignedTo', 'name profileImage');
        await existingItem.populate('createdBy', 'name profileImage');
        
        return sendSuccess(res, 200, '준비물 수량이 업데이트되었습니다', existingItem);
      }
    }

    // 새 준비물 생성
    const packingItem = await PackingItem.create({
      journeyId,
      name,
      count: count || 1,
      category,
      isShared: isShared || false,
      assignedTo: isShared ? assignedTo : null, // 공유 준비물만 할당 가능
      createdBy: req.user._id,
      isChecked: false
    });

    // 상세 정보를 위한 populate
    await packingItem.populate('assignedTo', 'name profileImage');
    await packingItem.populate('createdBy', 'name profileImage');

    return sendSuccess(res, 201, '준비물이 성공적으로 생성되었습니다', packingItem);
  } catch (error) {
    logger.error(`준비물 생성 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 준비물 일괄 생성 (테마 템플릿에서 가져오기)
 * @route POST /api/packing-items/bulk
 * @access Private
 */
const createBulkPackingItems = async (req, res) => {
  try {
    const { journeyId, templateName, selectedItems, mergeDuplicates = true } = req.body;

    if (!journeyId || !templateName || !selectedItems || !selectedItems.length) {
      return sendError(res, 400, '모든 필수 정보를 입력해주세요');
    }

    // 여행 정보 조회
    const journey = await Journey.findById(journeyId);

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 권한 확인 (참가자만 생성 가능)
    if (!journey.participants.includes(req.user._id)) {
      return sendError(res, 403, '이 여행의 준비물을 생성할 권한이 없습니다');
    }

    // 테마 템플릿 조회
    const themeTemplate = await ThemeTemplate.findOne({ themeName: templateName });

    if (!themeTemplate) {
      return sendError(res, 404, '템플릿을 찾을 수 없습니다');
    }

    // 선택된 아이템만 필터링
    const itemsToCreate = themeTemplate.items.filter(item => 
      selectedItems.includes(item.name)
    );

    const createdItems = [];
    const updatedItems = [];

    // 각 아이템에 대해 중복 확인 후 생성 또는 업데이트
    for (const item of itemsToCreate) {
      // 이름이 같은 아이템이 이미 있는지 확인
      if (mergeDuplicates) {
        const existingItem = await PackingItem.findOne({
          journeyId,
          name: item.name,
          isShared: false, // 개인 준비물로 기본 설정
          createdBy: req.user._id
        });

        // 이미 있으면 count만 증가
        if (existingItem) {
          existingItem.count += 1;
          await existingItem.save();
          updatedItems.push(existingItem);
          continue;
        }
      }

      // 새 준비물 생성
      const newItem = await PackingItem.create({
        journeyId,
        name: item.name,
        count: 1,
        category: item.category,
        isShared: false, // 개인 준비물로 기본 설정
        createdBy: req.user._id,
        isChecked: false
      });

      createdItems.push(newItem);
    }

    // 생성 및 업데이트된 모든 아이템 합치기
    const allItems = [...createdItems, ...updatedItems];

    // 결과 메시지 생성
    let message = '';
    if (createdItems.length > 0 && updatedItems.length > 0) {
      message = `${createdItems.length}개의 준비물이 생성되고, ${updatedItems.length}개의 준비물이 업데이트되었습니다`;
    } else if (createdItems.length > 0) {
      message = `${createdItems.length}개의 준비물이 성공적으로 생성되었습니다`;
    } else {
      message = `${updatedItems.length}개의 준비물이 업데이트되었습니다`;
    }

    return sendSuccess(res, 201, message, allItems);
  } catch (error) {
    logger.error(`준비물 일괄 생성 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 추천 준비물에서 선택한 항목들을 일괄 등록
 * @route POST /api/packing-items/from-recommendations
 * @access Private
 */
const createSelectedRecommendedItems = async (req, res) => {
  try {
    const { journeyId, selectedItems, mergeDuplicates = true } = req.body;

    if (!journeyId || !selectedItems || !selectedItems.length) {
      return sendError(res, 400, '모든 필수 정보를 입력해주세요');
    }

    // 여행 정보 조회
    const journey = await Journey.findById(journeyId);

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 권한 확인 (참가자만 생성 가능)
    if (!journey.participants.includes(req.user._id)) {
      return sendError(res, 403, '이 여행의 준비물을 생성할 권한이 없습니다');
    }

    const createdItems = [];
    const updatedItems = [];

    // 각 아이템에 대해 중복 확인 후 생성 또는 업데이트
    for (const item of selectedItems) {
      // 이름이 같은 아이템이 이미 있는지 확인
      if (mergeDuplicates) {
        const existingItem = await PackingItem.findOne({
          journeyId,
          name: item.name,
          isShared: false, // 개인 준비물로 기본 설정
          createdBy: req.user._id
        });

        // 이미 있으면 count만 업데이트
        if (existingItem) {
          existingItem.count = item.count || existingItem.count;
          await existingItem.save();
          await existingItem.populate('assignedTo', 'name profileImage');
          await existingItem.populate('createdBy', 'name profileImage');
          updatedItems.push(existingItem);
          continue;
        }
      }

      // 새 준비물 생성
      const newItem = await PackingItem.create({
        journeyId,
        name: item.name,
        count: item.count || 1,
        category: item.category,
        isShared: false, // 개인 준비물로 기본 설정
        createdBy: req.user._id,
        isChecked: false
      });

      // 상세 정보를 위한 populate
      await newItem.populate('assignedTo', 'name profileImage');
      await newItem.populate('createdBy', 'name profileImage');
      
      createdItems.push(newItem);
    }

    // 생성 및 업데이트된 모든 아이템 합치기
    const allItems = [...createdItems, ...updatedItems];

    // 결과 메시지 생성
    let message = '';
    if (createdItems.length > 0 && updatedItems.length > 0) {
      message = `${createdItems.length}개의 준비물이 생성되고, ${updatedItems.length}개의 준비물이 업데이트되었습니다`;
    } else if (createdItems.length > 0) {
      message = `${createdItems.length}개의 준비물이 성공적으로 생성되었습니다`;
    } else {
      message = `${updatedItems.length}개의 준비물이 업데이트되었습니다`;
    }

    return sendSuccess(res, 201, message, allItems);
  } catch (error) {
    logger.error(`추천 준비물 일괄 생성 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 준비물 업데이트
 * @route PUT /api/packing-items/:id
 * @access Private
 */
const updatePackingItem = async (req, res) => {
  try {
    const { name, count, category, isShared, assignedTo } = req.body;
    
    // 준비물 찾기
    const packingItem = await PackingItem.findById(req.params.id);

    if (!packingItem) {
      return sendError(res, 404, '준비물을 찾을 수 없습니다');
    }

    // 여행 정보 조회
    const journey = await Journey.findById(packingItem.journeyId);

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 권한 확인
    const isCreator = packingItem.createdBy.toString() === req.user._id.toString();
    const isParticipant = journey.participants.includes(req.user._id);

    // 생성자나 참가자만 업데이트 가능 (공유 준비물인 경우 모든 참가자가 수정 가능)
    if (!(isCreator || (packingItem.isShared && isParticipant))) {
      return sendError(res, 403, '이 준비물을 수정할 권한이 없습니다');
    }

    // 할당 대상이 있는 경우 참가자 확인
    if (assignedTo && !journey.participants.includes(assignedTo)) {
      return sendError(res, 400, '할당 대상은 여행 참가자여야 합니다');
    }

    // 업데이트할 필드 설정
    if (name) packingItem.name = name;
    if (count !== undefined) packingItem.count = count;
    if (category) packingItem.category = category;
    
    // 공유 상태 변경 (생성자만 가능)
    if (isShared !== undefined && isCreator) {
      packingItem.isShared = isShared;
      // 개인 준비물로 변경 시 할당 정보 제거
      if (!isShared) packingItem.assignedTo = null;
    }
    
    // 할당 대상 변경 (공유 준비물만 할당 가능)
    if (assignedTo !== undefined && packingItem.isShared) {
      packingItem.assignedTo = assignedTo;
    }

    // 저장
    await packingItem.save();

    // 상세 정보를 위한 populate
    await packingItem.populate('assignedTo', 'name profileImage');
    await packingItem.populate('createdBy', 'name profileImage');

    return sendSuccess(res, 200, '준비물이 성공적으로 업데이트되었습니다', packingItem);
  } catch (error) {
    logger.error(`준비물 업데이트 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 준비물 체크 상태 토글
 * @route PUT /api/packing-items/:id/toggle
 * @access Private
 */
const togglePackingItem = async (req, res) => {
  try {
    // 준비물 찾기
    const packingItem = await PackingItem.findById(req.params.id);

    if (!packingItem) {
      return sendError(res, 404, '준비물을 찾을 수 없습니다');
    }

    // 여행 정보 조회
    const journey = await Journey.findById(packingItem.journeyId);

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 권한 확인
    const isCreator = packingItem.createdBy.toString() === req.user._id.toString();
    const isAssigned = packingItem.assignedTo && packingItem.assignedTo.toString() === req.user._id.toString();
    const isParticipant = journey.participants.includes(req.user._id);

    // 개인 준비물: 생성자만 토글 가능
    // 공유 준비물: 할당된 사람 또는 할당자가 없는 경우 모든 참가자가 토글 가능
    if (
      (!packingItem.isShared && !isCreator) || 
      (packingItem.isShared && packingItem.assignedTo && !isAssigned) ||
      !isParticipant
    ) {
      return sendError(res, 403, '이 준비물의 상태를 변경할 권한이 없습니다');
    }

    // 체크 상태 토글 (체크 상태이면, 체크 해제하고, 체크 해제 상태이면 체크)
    // packingItem.isChecked = !packingItem.isChecked;
    packingItem.isChecked = packingItem.isChecked ? false : true;
    
    await packingItem.save();

    // 상세 정보를 위한 populate
    await packingItem.populate('assignedTo', 'name profileImage');
    await packingItem.populate('createdBy', 'name profileImage');

    return sendSuccess(res, 200, '준비물 상태가 성공적으로 변경되었습니다', packingItem);
  } catch (error) {
    logger.error(`준비물 토글 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 준비물 삭제
 * @route DELETE /api/packing-items/:id
 * @access Private
 */
const deletePackingItem = async (req, res) => {
  try {
    // 준비물 찾기
    const packingItem = await PackingItem.findById(req.params.id);

    if (!packingItem) {
      return sendError(res, 404, '준비물을 찾을 수 없습니다');
    }

    // 권한 확인 (생성자만 삭제 가능)
    if (packingItem.createdBy.toString() !== req.user._id.toString()) {
      return sendError(res, 403, '이 준비물을 삭제할 권한이 없습니다');
    }

    // 준비물 삭제
    await packingItem.deleteOne();

    return sendSuccess(res, 200, '준비물이 성공적으로 삭제되었습니다');
  } catch (error) {
    logger.error(`준비물 삭제 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 카테고리별 준비물 조회
 * @route GET /api/packing-items/categories/:journeyId
 * @access Private
 */
const getPackingItemsByCategory = async (req, res) => {
  try {
    const { journeyId } = req.params;

    // 여행 정보 조회
    const journey = await Journey.findById(journeyId);

    if (!journey) {
      return sendError(res, 404, '여행을 찾을 수 없습니다');
    }

    // 권한 확인 (참가자만 조회 가능)
    if (!journey.participants.includes(req.user._id)) {
      return sendError(res, 403, '이 여행의 준비물을 조회할 권한이 없습니다');
    }

    // 준비물 조회 (공유 준비물 + 내 개인 준비물)
    const packingItems = await PackingItem.find({
      journeyId,
      $or: [
        { isShared: true },
        { isShared: false, createdBy: req.user._id }
      ]
    }).populate('assignedTo', 'name profileImage')
      .populate('createdBy', 'name profileImage');

    // 카테고리별로 그룹화
    const categorizedItems = {};
    const categories = ['clothing', 'electronics', 'toiletries', 'documents', 'medicines', 'essentials', 'other'];

    // 카테고리별 빈 배열 초기화
    categories.forEach(category => {
      categorizedItems[category] = [];
    });

    // 준비물을 카테고리별로 분류
    packingItems.forEach(item => {
      if (categorizedItems[item.category]) {
        categorizedItems[item.category].push(item);
      } else {
        categorizedItems['other'].push(item);
      }
    });

    return sendSuccess(res, 200, '카테고리별 준비물 목록입니다', categorizedItems);
  } catch (error) {
    logger.error(`카테고리별 준비물 조회 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 테마별 준비물 템플릿 목록 조회
 * @route GET /api/packing-items/templates
 * @access Private
 */
const getThemeTemplates = async (req, res) => {
  try {
    const templates = await ThemeTemplate.find().sort({ themeName: 1 });
    return sendSuccess(res, 200, '테마별 준비물 템플릿 목록입니다', templates);
  } catch (error) {
    logger.error(`테마 템플릿 목록 조회 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

/**
 * 특정 테마의 준비물 템플릿 조회
 * @route GET /api/packing-items/templates/:themeName
 * @access Private
 */
const getThemeTemplateByName = async (req, res) => {
  try {
    const { themeName } = req.params;
    
    const template = await ThemeTemplate.findOne({ themeName });
    
    if (!template) {
      return sendError(res, 404, '해당 테마의 템플릿을 찾을 수 없습니다');
    }
    
    return sendSuccess(res, 200, `${themeName} 테마의 준비물 템플릿입니다`, template);
  } catch (error) {
    logger.error(`테마 템플릿 조회 오류: ${error.message}`);
    return sendError(res, 500, '서버 오류가 발생했습니다');
  }
};

module.exports = {
  getPackingItemsByJourney,
  createPackingItem,
  createBulkPackingItems,
  createSelectedRecommendedItems,
  updatePackingItem,
  togglePackingItem,
  deletePackingItem,
  getPackingItemsByCategory,
  getThemeTemplates,
  getThemeTemplateByName
};