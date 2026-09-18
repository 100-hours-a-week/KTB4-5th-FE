export type StorageMethod = "cold" | "frozen";

export type HomeAttentionItem = {
  id: string;
  name: string;
  quantity: number;
  storage: StorageMethod;
  expiryDate: string;
  daysLeft: number;
};

export type HomeSummary = {
  attentionItems: HomeAttentionItem[];
  stockTypeCount: number;
};

export const HOME_ATTENTION_LIMIT = 3;
export const STOCK_TYPE_LIMIT = 100;

// 홈 mock 데이터
export function getHomeSummary(): HomeSummary {
  return {
    attentionItems: [
      {
        id: "egg-1",
        name: "달걀",
        quantity: 10,
        storage: "cold",
        expiryDate: "2026-09-16",
        daysLeft: -2,
      },
      {
        id: "tofu-1",
        name: "두부",
        quantity: 2,
        storage: "cold",
        expiryDate: "2026-09-18",
        daysLeft: 0,
      },
      {
        id: "milk-1",
        name: "우유",
        quantity: 1,
        storage: "cold",
        expiryDate: "2026-09-19",
        daysLeft: 1,
      },
    ],
    stockTypeCount: 38,
  };
}
