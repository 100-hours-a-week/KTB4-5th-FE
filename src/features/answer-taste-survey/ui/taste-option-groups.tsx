"use client";

import { FilterChip } from "@/shared/ui/filter-chip";

import { TASTE_GROUPS, type TasteGroup } from "../model/taste-groups";

type TasteOptionGroupsProps = {
  value: string[];
  onChange: (optionIds: string[]) => void;
};

export function TasteOptionGroups({ value, onChange }: TasteOptionGroupsProps) {
  function toggle(group: TasteGroup, optionId: string) {
    if (value.includes(optionId))
      return onChange(value.filter((id) => id !== optionId));
    if (group.multiple) return onChange([...value, optionId]);
    const groupIds = group.options.map(({ id }) => id);
    onChange([...value.filter((id) => !groupIds.includes(id)), optionId]);
  }

  return TASTE_GROUPS.map((group) => (
    <fieldset key={group.id} className="m-0 border-0 p-0">
      <legend className="p-0 text-[13.5px] font-bold text-app-ink">
        {group.label}
        {group.multiple ? (
          <span className="ml-1 font-normal text-app-ink/45">여러 개 선택</span>
        ) : null}
      </legend>
      <div className="mt-1 flex flex-wrap gap-x-2">
        {group.options.map((option) => (
          <FilterChip
            key={option.id}
            selected={value.includes(option.id)}
            onClick={() => toggle(group, option.id)}
          >
            {option.label}
          </FilterChip>
        ))}
      </div>
    </fieldset>
  ));
}
