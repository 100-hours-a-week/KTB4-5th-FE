"use client";

import { RegisterCapacityBoundary } from "@/widgets/ingredient-draft-form";

import { ManualRegisterForm } from "./manual-register-form";

export function RegisterIngredientManualPage() {
  return (
    <RegisterCapacityBoundary>
      {(capacity) => <ManualRegisterForm capacity={capacity} />}
    </RegisterCapacityBoundary>
  );
}
