import { z } from "zod";

const LOGIN_ID_PATTERN = /^[가-힣a-zA-Z0-9]+$/;
const LOGIN_ID_MIN_LENGTH = 2;
const LOGIN_ID_MAX_LENGTH = 10;

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]+$/;

export const LOGIN_ID_HINT = "2~10자 · 한글·영문·숫자만";
export const PASSWORD_HINT = "8자 이상 · 영문+숫자 조합 · 특수문자 불가";

// 우선순위: 비어 있음 > 형식 > 범위.
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
    !PASSWORD_PATTERN.test(value)
  ) {
    ctx.addIssue({ code: "custom", message: PASSWORD_HINT });
  }
});

export const loginFormSchema = z.object({
  loginId: loginIdSchema,
  password: passwordSchema,
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
