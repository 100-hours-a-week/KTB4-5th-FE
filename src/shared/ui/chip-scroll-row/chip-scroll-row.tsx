"use client";

import { ChevronLeftOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ChipScrollRowProps = {
  children: ReactNode;
  "aria-label": string;
};

export function ChipScrollRow({
  children,
  "aria-label": ariaLabel,
}: ChipScrollRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const updateEdges = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const start = row.scrollLeft > 1;
    const end = row.scrollLeft + row.clientWidth < row.scrollWidth - 1;
    setEdges((prev) =>
      prev.start === start && prev.end === end ? prev : { start, end },
    );
  }, []);

  useEffect(() => {
    updateEdges();
  });

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(row);
    return () => observer.disconnect();
  }, [updateEdges]);

  const scrollByPage = (direction: -1 | 1) => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({
      left: direction * row.clientWidth * 0.7,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div
        ref={rowRef}
        role="group"
        aria-label={ariaLabel}
        onScroll={updateEdges}
        className="flex items-center gap-1.5 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {edges.start ? (
        <ScrollButton side="start" onClick={() => scrollByPage(-1)} />
      ) : null}
      {edges.end ? (
        <ScrollButton side="end" onClick={() => scrollByPage(1)} />
      ) : null}
    </div>
  );
}

function ScrollButton({
  side,
  onClick,
}: {
  side: "start" | "end";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      onClick={onClick}
      className={`absolute inset-y-0 hidden w-12 cursor-pointer items-center from-app-bg from-40% to-transparent text-app-ink/60 [@media(pointer:fine)]:flex ${
        side === "start"
          ? "left-0 justify-start bg-linear-to-r"
          : "right-0 justify-end bg-linear-to-l"
      }`}
    >
      <Lineicons
        icon={ChevronLeftOutlined}
        size={14}
        strokeWidth={2}
        aria-hidden="true"
        focusable="false"
        className={side === "end" ? "rotate-180" : undefined}
      />
    </button>
  );
}
