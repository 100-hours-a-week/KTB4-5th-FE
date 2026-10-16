import { CurrentRefrigeratorGate } from "@/_app/providers/current-refrigerator-gate";
import { AppShell } from "@/widgets/app-shell";
import { BottomTabNavigation } from "@/widgets/bottom-tab-navigation";
import { AnalysisTaskBanner, RouteHeader } from "@/widgets/route-header";

export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell
      header={
        <>
          <RouteHeader mode="tabs" />
          <AnalysisTaskBanner />
        </>
      }
      navigation={<BottomTabNavigation />}
    >
      <CurrentRefrigeratorGate>{children}</CurrentRefrigeratorGate>
    </AppShell>
  );
}
