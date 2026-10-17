export type MypageOverview = {
  userId: string;
  nickname: string;
  email: string | null;
  profileImageUrl: string | null;
  refrigeratorId: string;
  refrigeratorName: string;
  ingredientsNum: number;
  expiredIngredientsNum: number;
  memberNum: number;
  notificationPreferences: { type: string; isEnabled: boolean }[];
};
