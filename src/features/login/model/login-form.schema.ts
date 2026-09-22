import { z } from "zod";

// docs/AUTH_SESSION_SECURITY.md §8.1 (실측 확인): loginId는 영문·숫자만
// 2~10자. 한글은 백엔드가 거부한다(2026-09-22 curl로 확인) — 화면 안내
// 문구도 이 규칙과 맞춰야 한다.
const LOGIN_ID_PATTERN = /^[a-zA-Z0-9]+$/;
const LOGIN_ID_MIN_LENGTH = 2;
const LOGIN_ID_MAX_LENGTH = 10;

// password: 8자 이상 + 영문·숫자 각 1자 이상.
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_HAS_LETTER_AND_DIGIT = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export const LOGIN_ID_HINT = "2~10자 · 영문·숫자만";
export const PASSWORD_HINT = "8자 이상 · 영문+숫자 조합";

// SERVICE_COMMON_RULES §5.1 우선순위: 비어 있음 > 형식 > 범위.
// 이 프로젝트는 두 조건(글자 수·구성)을 한 문구로 합쳐 표시하는 필드라
// 형식 위반이면 바로 해당 힌트 문구를 오류 사유로 재사용한다.
const loginIdSchema = z.string().superRefine((value, ctx) => {
  if (value === "") {
    ctx.addIssue({ code: "custom", message: "아이디를 입력해주세요" });
    return;
  }

  if (
    !LOGIN_ID_PATTERN.test(value) ||
    value.length < LOGIN_ID_MIN_LENGTH ||
    value.length > LOGIN_ID_MAX_LENGTH
  ) {
    ctx.addIssue({ code: "custom", message: LOGIN_ID_HINT });
  }
});

const passwordSchema = z.string().superRefine((value, ctx) => {
  if (value === "") {
    ctx.addIssue({ code: "custom", message: "비밀번호를 입력해주세요" });
    return;
  }

  if (
    value.length < PASSWORD_MIN_LENGTH ||
    !PASSWORD_HAS_LETTER_AND_DIGIT.test(value)
  ) {
    ctx.addIssue({ code: "custom", message: PASSWORD_HINT });
  }
});

export const loginFormSchema = z.object({
  loginId: loginIdSchema,
  password: passwordSchema,
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
