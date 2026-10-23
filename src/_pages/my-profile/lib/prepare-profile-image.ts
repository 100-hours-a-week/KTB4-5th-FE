const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.85;

export const PROFILE_IMAGE_ACCEPT = ACCEPTED_TYPES.join(",");

export type ProfileImageError = "type" | "size" | "read";

export class ProfileImagePrepareError extends Error {
  constructor(readonly reason: ProfileImageError) {
    super(reason);
    this.name = "ProfileImagePrepareError";
  }
}

function isAcceptedType(file: File) {
  return file.type
    ? ACCEPTED_TYPES.includes(file.type.toLowerCase())
    : ACCEPTED_EXTENSIONS.test(file.name);
}

async function decodeImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function prepareProfileImage(file: File): Promise<File> {
  if (!isAcceptedType(file)) throw new ProfileImagePrepareError("type");
  if (file.size > MAX_SOURCE_BYTES) throw new ProfileImagePrepareError("size");

  let image: HTMLImageElement;
  try {
    image = await decodeImage(file);
  } catch {
    throw new ProfileImagePrepareError("read");
  }

  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new ProfileImagePrepareError("read");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new ProfileImagePrepareError("read");

  return new File([blob], "profile.jpg", { type: "image/jpeg" });
}
