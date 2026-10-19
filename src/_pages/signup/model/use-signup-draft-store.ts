import { create } from "zustand";

export const TERMS = [
  { id: "service", label: "서비스 이용약관", required: true },
  { id: "privacy", label: "개인정보 수집·이용 동의", required: true },
  { id: "age", label: "만 14세 이상입니다", required: true },
  { id: "marketing", label: "마케팅 정보 수신 동의", required: false },
] as const;

export type TermId = (typeof TERMS)[number]["id"];

type SignupDraftState = {
  agreed: Partial<Record<TermId, boolean>>;
  nickname: string;
  nicknameError: string | null;
  notificationEnabled: boolean;
  setAgreed: (agreed: Partial<Record<TermId, boolean>>) => void;
  setNickname: (nickname: string) => void;
  setNicknameError: (message: string) => void;
  setNotificationEnabled: (enabled: boolean) => void;
  reset: () => void;
};

const INITIAL_DRAFT = {
  agreed: {},
  nickname: "",
  nicknameError: null,
  notificationEnabled: true,
};

export const useSignupDraftStore = create<SignupDraftState>((set) => ({
  ...INITIAL_DRAFT,
  setAgreed: (agreed) => set({ agreed }),
  setNickname: (nickname) => set({ nickname, nicknameError: null }),
  setNicknameError: (nicknameError) => set({ nicknameError }),
  setNotificationEnabled: (notificationEnabled) => set({ notificationEnabled }),
  reset: () => set(INITIAL_DRAFT),
}));
