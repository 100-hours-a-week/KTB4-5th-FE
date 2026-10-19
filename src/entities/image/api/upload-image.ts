import { requestJson } from "@/shared/api";

export type ImageUploadPurpose = "ANALYSIS" | "PROFILE";

type PresignedUploadRequest = {
  purpose: ImageUploadPurpose;
  contentType: string;
  byteSize: number;
  sha256: string;
};

type PresignedUpload = {
  objectKey: string;
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  expiresAt: string;
};

export class ImageStorageUploadError extends Error {
  constructor(readonly status: number) {
    super(`이미지 저장소 업로드 실패 (${status})`);
    this.name = "ImageStorageUploadError";
  }
}

async function hashSha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function requestPresignedUpload(body: PresignedUploadRequest) {
  return requestJson<PresignedUpload>("/image/presigned-url", {
    method: "POST",
    json: body,
  });
}

export async function uploadImage(
  file: File,
  purpose: ImageUploadPurpose,
): Promise<string> {
  const { data } = await requestPresignedUpload({
    purpose,
    contentType: file.type,
    byteSize: file.size,
    sha256: await hashSha256Hex(file),
  });

  const response = await fetch(data.uploadUrl, {
    method: data.method,
    headers: data.headers,
    body: file,
  });

  if (!response.ok) throw new ImageStorageUploadError(response.status);

  return data.objectKey;
}
