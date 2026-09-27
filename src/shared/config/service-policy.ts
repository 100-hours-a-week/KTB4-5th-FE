export const STOCK_TYPE_LIMIT = 100;
export const INGREDIENT_REGISTER_BATCH_LIMIT = 20;

/** 한 품목이 가질 수 있는 수량 상한. 품목 종류 한도(STOCK_TYPE_LIMIT)와는 별개다. */
export const INGREDIENT_QUANTITY_MAX = 100;
export const INGREDIENT_QUANTITY_MIN = 1;

export const INGREDIENT_WEIGHT_MAX = 50_000;
export const INGREDIENT_WEIGHT_MIN = 1;

/** 유통기한으로 고를 수 있는 미래 범위. 오늘부터 이 햇수 이내만 선택한다. */
export const EXPIRATION_MAX_YEARS = 4;

export const TEXT_FIELD_MIN_LENGTH = 2;
export const TEXT_FIELD_MAX_LENGTH = 10;
