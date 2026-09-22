import { LogoutSettingsCard } from "./logout-settings-card";
import { SettingsCard } from "./settings-card";

export function MyPage() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-8 pb-6">
      <div className="flex flex-col gap-3">
        <SettingsCard
          title="알림"
          description="매일 오전 8시 · 켜짐"
          trailingText="다음 버전"
        />
        <LogoutSettingsCard />
      </div>
    </div>
  );
}
