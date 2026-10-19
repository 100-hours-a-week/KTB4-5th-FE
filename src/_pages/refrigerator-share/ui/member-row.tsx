import type { RefrigeratorMember } from "@/entities/refrigerator";
import { UserAvatar } from "@/entities/user";

type MemberRowProps = {
  member: RefrigeratorMember;
  isMe: boolean;
  canRemove: boolean;
  onRemove: () => void;
};

export function MemberRow({
  member,
  isMe,
  canRemove,
  onRemove,
}: MemberRowProps) {
  const roleLabel = member.role === "owner" ? "방장" : "참여자";

  return (
    <li className="flex items-center gap-3 border-b border-app-ink/8 py-3 last:border-b-0">
      <UserAvatar src={member.profileImageUrl} size={40} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-bold text-app-ink">
          {member.nickname}
        </span>
        <span className="mt-0.5 block text-[12.5px] text-app-ink/55">
          {isMe ? `${roleLabel} · 나` : roleLabel}
        </span>
      </span>
      {canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="min-h-11 flex-none cursor-pointer rounded-[4px] px-3 text-[12.5px] font-bold text-app-ink/70 hover:bg-app-neutral-100 active:bg-app-neutral-200"
        >
          내보내기
        </button>
      ) : null}
    </li>
  );
}
