import { requestNoContent } from "@/shared/api";

export function deleteImageAnalysis(analysisId: string): Promise<void> {
  return requestNoContent(`/image-analyses/${encodeURIComponent(analysisId)}`, {
    method: "DELETE",
  });
}
