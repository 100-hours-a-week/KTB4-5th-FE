import type { Area } from "react-easy-crop";

export const PROFILE_PHOTO_ACCEPT = "image/jpeg,image/png";
export const PROFILE_PHOTO_HINT = "JPG · PNG · 정사각형으로 잘려 저장돼요";

const PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png"];
const PROFILE_PHOTO_MAX_BYTES = 20 * 1024 * 1024;
const PROFILE_PHOTO_SIZE = 512;
const PROFILE_PHOTO_QUALITY = 0.9;

export const PROFILE_PHOTO_READ_ERROR =
  "사진을 불러오지 못했어요. 다른 사진을 골라 주세요";

export function getProfilePhotoFileError(file: File): string | null {
  if (!PROFILE_PHOTO_TYPES.includes(file.type)) {
    return "JPG나 PNG 사진만 올릴 수 있어요";
  }

  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    return "사진이 너무 커요. 20MB 이하로 골라 주세요";
  }

  return null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export async function cropProfilePhoto(src: string, area: Area): Promise<File> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = PROFILE_PHOTO_SIZE;
  canvas.height = PROFILE_PHOTO_SIZE;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("캔버스를 만들 수 없습니다.");

  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    PROFILE_PHOTO_SIZE,
    PROFILE_PHOTO_SIZE,
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", PROFILE_PHOTO_QUALITY),
  );
  if (!blob) throw new Error("사진을 자르지 못했습니다.");

  return new File([blob], "profile.jpg", { type: "image/jpeg" });
}
