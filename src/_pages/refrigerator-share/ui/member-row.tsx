import type { RefrigeratorMember } from "@/entities/refrigerator";

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
      <span
        aria-hidden="true"
        className="flex size-10 flex-none items-center justify-center rounded-full bg-app-neutral-100 font-app-heading text-[14px] font-black text-app-ink/60"
      >
        {member.nickname.slice(0, 1)}
      </span>
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
