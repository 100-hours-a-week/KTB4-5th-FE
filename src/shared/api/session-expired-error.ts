export class SessionExpiredError extends Error {
  constructor() {
    super("세션이 만료되었습니다. 다시 로그인해 주세요.");
    this.name = "SessionExpiredError";
  }
}
