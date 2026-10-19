export type RefrigeratorMemberRole = "owner" | "member";

export type RefrigeratorMember = {
  userId: string;
  nickname: string;
  profileImageUrl: string | null;
  role: RefrigeratorMemberRole;
};

export type RefrigeratorMembers = {
  currentUserId: string;
  refrigeratorName: string;
  memberCount: number;
  memberMax: number;
  members: RefrigeratorMember[];
};
