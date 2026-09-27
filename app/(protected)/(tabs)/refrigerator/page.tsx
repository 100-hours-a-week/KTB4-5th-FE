import { RefrigeratorPage } from "@/_pages/refrigerator";

export default async function Page({
  searchParams,
}: PageProps<"/refrigerator">) {
  return <RefrigeratorPage queryParams={await searchParams} />;
}
