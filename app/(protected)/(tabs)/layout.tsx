import { getUserSession } from "@/entities/user/index.server";
import { AppShell } from "@/widgets/app-shell";
import { BottomTabNavigation } from "@/widgets/bottom-tab-navigation";
import { RouteHeader } from "@/widgets/route-header";

export default async function TabsLayout({ children }: LayoutProps<"/">) {
  const session = await getUserSession();

  return (
    <AppShell
      header={
        <RouteHeader
          mode="tabs"
          homeTitle={session ? `${session.loginId}네 냉장고` : undefined}
        />
      }
      navigation={<BottomTabNavigation />}
    >
      {children}
    </AppShell>
  );
}
