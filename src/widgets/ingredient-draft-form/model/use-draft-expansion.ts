"use client";

import { useState } from "react";

export function useDraftExpansion(initialIndex: number | null) {
  const [expandedIndex, setExpandedIndex] = useState(initialIndex);

  function toggle(index: number) {
    setExpandedIndex((current) => (current === index ? null : index));
  }

  function shiftAfterRemove(index: number) {
    setExpandedIndex((current) => {
      if (current === null || current === index) return null;
      return current > index ? current - 1 : current;
    });
  }

  return { expandedIndex, expand: setExpandedIndex, toggle, shiftAfterRemove };
}
