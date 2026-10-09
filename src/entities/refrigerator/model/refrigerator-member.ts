export type RefrigeratorMemberRole = "owner" | "member";

export type RefrigeratorMember = {
  userId: string;
  nickname: string;
  role: RefrigeratorMemberRole;
};

export type RefrigeratorMembers = {
  refrigeratorName: string;
  memberCount: number;
  memberMax: number;
  members: RefrigeratorMember[];
};
