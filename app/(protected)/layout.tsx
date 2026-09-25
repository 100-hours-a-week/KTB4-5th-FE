import { NotificationPoller } from "@/widgets/notification-poller";

export default function ProtectedLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <NotificationPoller />
      {children}
    </>
  );
}
