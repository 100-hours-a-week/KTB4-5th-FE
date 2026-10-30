export type TasteGroup = {
  id: string;
  label: string;
  multiple: boolean;
  options: { id: string; label: string }[];
};

export const TASTE_GROUPS: TasteGroup[] = [
  {
    id: "flavor",
    label: "오늘 끌리는 맛",
    multiple: true,
    options: [
      { id: "spicy", label: "매콤한" },
      { id: "mild", label: "담백한" },
      { id: "savory", label: "짭짤한" },
      { id: "sweet", label: "달콤한" },
    ],
  },
  {
    id: "cuisine",
    label: "요리 종류",
    multiple: true,
    options: [
      { id: "korean", label: "한식" },
      { id: "western", label: "양식" },
      { id: "chinese", label: "중식" },
      { id: "japanese", label: "일식" },
    ],
  },
  {
    id: "servings",
    label: "인분 수",
    multiple: false,
    options: [
      { id: "servings-1", label: "1인분" },
      { id: "servings-2", label: "2인분" },
      { id: "servings-3", label: "3인분" },
      { id: "servings-4", label: "4인분 이상" },
    ],
  },
  {
    id: "difficulty",
    label: "조리 난이도",
    multiple: false,
    options: [
      { id: "easy", label: "쉬움" },
      { id: "medium", label: "중간" },
      { id: "hard", label: "어려움" },
    ],
  },
  {
    id: "purpose",
    label: "식사 목적",
    multiple: false,
    options: [
      { id: "snack", label: "간식" },
      { id: "dessert", label: "디저트" },
      { id: "meal", label: "한끼" },
      { id: "quick-meal", label: "간편한 식사" },
    ],
  },
  {
    id: "texture",
    label: "식감",
    multiple: true,
    options: [
      { id: "crispy", label: "바삭" },
      { id: "chewy", label: "쫄깃" },
      { id: "soft", label: "부드러운" },
    ],
  },
];

export function toTasteLabels(optionIds: string[]) {
  return TASTE_GROUPS.flatMap(({ options }) => options)
    .filter(({ id }) => optionIds.includes(id))
    .map(({ label }) => label);
}

export function toRecommendationJobRequest(optionIds: string[]) {
  const servings = optionIds.find((id) => id.startsWith("servings-"));
  return {
    targetServings: servings ? Number(servings.slice(9)) : undefined,
    preferenceTags: toTasteLabels(
      optionIds.filter((id) => id !== servings),
    ).slice(0, 12),
  };
}
