import { CurrentRefrigeratorGate } from "@/_app/providers/current-refrigerator-gate";
import { AppShell } from "@/widgets/app-shell";
import { RouteHeader } from "@/widgets/route-header";

export default function FlowLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell header={<RouteHeader mode="flow" />} navigationVisible={false}>
      <CurrentRefrigeratorGate>{children}</CurrentRefrigeratorGate>
    </AppShell>
  );
}
