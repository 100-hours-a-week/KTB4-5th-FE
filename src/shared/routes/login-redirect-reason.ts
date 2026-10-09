export const LOGIN_REDIRECT_REASON_PARAM = "reason";

export const loginRedirectReasons = {
  authRequired: "auth-required",
  sessionExpired: "session-expired",
  signupExpired: "signup-expired",
  alreadyRegistered: "already-registered",
} as const;

export type LoginRedirectReason =
  (typeof loginRedirectReasons)[keyof typeof loginRedirectReasons];

const loginRedirectReasonValues: readonly string[] =
  Object.values(loginRedirectReasons);

export function isLoginRedirectReason(
  value: string | null,
): value is LoginRedirectReason {
  return value !== null && loginRedirectReasonValues.includes(value);
}
