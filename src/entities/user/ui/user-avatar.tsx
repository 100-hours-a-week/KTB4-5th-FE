import { User4Outlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import Image from "next/image";

type UserAvatarProps = {
  src: string | null;
  size: number;
};

export function UserAvatar({ src, size }: UserAvatarProps) {
  return (
    <span
      className="relative grid flex-none place-items-center overflow-hidden rounded-full bg-app-neutral-200 text-app-neutral-500"
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt="프로필 사진"
          fill
          sizes={`${size}px`}
          unoptimized
          className="object-cover"
        />
      ) : (
        <Lineicons
          icon={User4Outlined}
          size={Math.round(size * 0.45)}
          aria-label="프로필 사진 없음"
        />
      )}
    </span>
  );
}
