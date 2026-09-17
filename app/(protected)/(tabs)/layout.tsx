import { AppShell } from "@/widgets/app-shell";
import { BottomTabNavigation } from "@/widgets/bottom-tab-navigation";
import { RouteHeader } from "@/widgets/route-header";

export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell
      header={<RouteHeader mode="tabs" />}
      navigation={<BottomTabNavigation />}
    >
      {children}
    </AppShell>
  );
}
