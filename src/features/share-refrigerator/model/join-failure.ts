import { ApiError } from "@/shared/api";

export type JoinFailure =
  | { kind: "helper"; message: string }
  | { kind: "dialog"; title: string; description: string }
  | { kind: "toast"; message: string };

export function getJoinFailure(error: unknown): JoinFailure {
  if (!(error instanceof ApiError)) {
    return { kind: "toast", message: "인터넷 연결을 확인해 주세요" };
  }

  switch (error.code) {
    case "REFRIGERATOR-404-002":
      return { kind: "helper", message: "없는 코드예요" };
    case "REFRIGERATOR-400-002":
      return { kind: "helper", message: "코드 형식을 확인해 주세요" };
    case "REFRIGERATOR-400-001":
      return { kind: "helper", message: "내 냉장고 코드로는 참여할 수 없어요" };
    case "REFRIGERATOR-400-004":
      return {
        kind: "dialog",
        title: "코드가 유효하지 않습니다.",
        description: "방장에게 새로운 코드를 요청해주세요",
      };
    case "REFRIGERATOR-400-003":
      return {
        kind: "dialog",
        title: "공유받을 냉장고의 인원이 가득 찼습니다.",
        description: "방장에게 문의해주세요",
      };
    case "REFRIGERATOR-409-001":
      return {
        kind: "toast",
        message: "지금 냉장고에서 나간 뒤 참여할 수 있어요",
      };
    default:
      return {
        kind: "toast",
        message: "문제가 생겼어요. 잠시 후 다시 시도해 주세요",
      };
  }
}
