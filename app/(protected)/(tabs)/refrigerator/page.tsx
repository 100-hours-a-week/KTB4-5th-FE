import { RefrigeratorServerPage } from "@/_pages/refrigerator/index.server";

export default async function Page({
  searchParams,
}: PageProps<"/refrigerator">) {
  return <RefrigeratorServerPage queryParams={await searchParams} />;
}
