"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  toIngredientListKeyword,
  type IngredientListQuery,
} from "@/entities/ingredient";
import { TEXT_FIELD_MAX_LENGTH } from "@/shared/config";

import { useIngredientListNavigation } from "../model/use-ingredient-list-navigation";
import { IngredientFilterSection } from "./ingredient-filter-section";
import { IngredientSortFilter } from "./ingredient-sort-filter";

const SEARCH_DEBOUNCE_MS = 300;

type IngredientControlsContainerProps = {
  query: IngredientListQuery;
  filteredCount: number;
  isLoading: boolean;
};

export function IngredientControlsContainer({
  filteredCount,
  isLoading,
  query,
}: IngredientControlsContainerProps) {
  const [searchTerm, setSearchTerm] = useState(query.keyword ?? "");
  const [syncedKeyword, setSyncedKeyword] = useState(query.keyword);
  const updateQuery = useIngredientListNavigation(query);

  if (query.keyword !== syncedKeyword) {
    setSyncedKeyword(query.keyword);
    if (toIngredientListKeyword(searchTerm) !== query.keyword) {
      setSearchTerm(query.keyword ?? "");
    }
  }

  useEffect(() => {
    const keyword = toIngredientListKeyword(searchTerm);
    if (keyword === query.keyword) return;

    const timer = setTimeout(
      () => updateQuery({ keyword }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchTerm, query.keyword, updateQuery]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateQuery({ keyword: toIngredientListKeyword(searchTerm) });
    event.currentTarget.querySelector("input")?.blur();
  }

  function clearSearch() {
    setSearchTerm("");
    updateQuery({ keyword: null });
  }
  const countText = isLoading ? "재고 조회 중" : `총 ${filteredCount}종`;

  return (
    <div className="flex-none">
      <div className="px-5 pt-4">
        <form
          role="search"
          onSubmit={submitSearch}
          className="mb-3 flex min-h-12 items-center gap-3 rounded-[4px] border border-app-ink/20 bg-white pl-4 pr-1 focus-within:border-app-ink"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="size-5 shrink-0 text-app-ink/55"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
          <label htmlFor="ingredient-search" className="sr-only">
            재료 검색
          </label>
          <input
            id="ingredient-search"
            type="search"
            enterKeyHint="search"
            maxLength={TEXT_FIELD_MAX_LENGTH}
            placeholder="재료 이름을 검색해 보세요"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-app-ink outline-none placeholder:text-app-ink/45 [&::-webkit-search-cancel-button]:hidden"
          />
          {searchTerm ? (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={clearSearch}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-app-ink/55 hover:bg-app-ink/5 hover:text-app-ink"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="size-4"
              >
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          ) : null}
        </form>
        <IngredientFilterSection
          filter={query.filter}
          category={query.category}
          onFilterChange={(filter) => updateQuery({ filter })}
          onCategoryChange={(category) => updateQuery({ category })}
        />
      </div>

      <div className="flex items-center justify-between gap-3 px-5 pt-3">
        <p className="mb-0 min-w-0 truncate text-[12.5px] leading-tight text-app-ink/55">
          {countText}
        </p>
        <IngredientSortFilter
          sort={query.sort}
          onSortChange={(sort) => updateQuery({ sort })}
        />
      </div>
    </div>
  );
}
