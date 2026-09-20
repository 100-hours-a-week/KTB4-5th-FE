import { getRegisterCapacity } from "../model/register-capacity";
import { ManualRegisterForm } from "./manual-register-form";

export function RegisterIngredientManualPage() {
  return <ManualRegisterForm capacity={getRegisterCapacity()} />;
}
