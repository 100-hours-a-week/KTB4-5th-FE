import { Pencil1Outlined } from "@lineiconshq/free-icons";

import { routes } from "@/shared/routes";

import { getRegisterCapacity } from "../model/register-capacity";
import { RegisterCapacityNotice } from "./register-capacity-notice";
import { RegisterMethodCard } from "./register-method-card";

export function RegisterIngredientPage() {
  const capacity = getRegisterCapacity();

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-5 pt-6 pb-[calc(var(--space-6)+var(--safe-bottom))] [-webkit-overflow-scrolling:touch]">
      <h2
        id="register-method-heading"
        className="mb-5 text-[28px] text-app-ink"
      >
        어떻게 등록할까요?
      </h2>

      <RegisterCapacityNotice capacity={capacity} />

      <ul className="mt-5" aria-labelledby="register-method-heading">
        <li>
          <RegisterMethodCard
            href={routes.registerIngredientManual}
            icon={Pencil1Outlined}
            title="직접 쓰기"
            description="재료 하나씩 정보를 직접 써요"
            disabled={capacity.isLimitReached}
          />
        </li>
      </ul>
    </main>
  );
}
