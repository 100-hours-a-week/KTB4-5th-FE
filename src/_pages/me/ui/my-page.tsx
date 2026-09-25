import { LogoutSettingsCard } from "./logout-settings-card";
import { PushNotificationSettingsCard } from "./push-notification-settings-card";

export function MyPage() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-8 pb-6">
      <div className="flex flex-col gap-3">
        <PushNotificationSettingsCard />
        <LogoutSettingsCard />
      </div>
    </div>
  );
}
