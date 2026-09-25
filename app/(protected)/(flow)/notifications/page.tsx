import { NotificationsPage } from "@/_pages/notifications";

export default async function Page({
  searchParams,
}: PageProps<"/notifications">) {
  return <NotificationsPage queryParams={await searchParams} />;
}
