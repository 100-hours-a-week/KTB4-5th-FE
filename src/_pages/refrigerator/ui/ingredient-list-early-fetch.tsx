"use client";

type IngredientListEarlyFetchProps = {
  script: string;
};

export function IngredientListEarlyFetch({
  script,
}: IngredientListEarlyFetchProps) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
