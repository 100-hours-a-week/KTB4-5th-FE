import { RegisterIngredientReceiptResultPage } from "@/_pages/register-ingredient-receipt";

export default async function ReceiptResultRoute({
  searchParams,
}: PageProps<"/refrigerator/register/receipt/result">) {
  const params = await searchParams;
  const analysisId =
    typeof params.analysisId === "string" ? params.analysisId : undefined;
  return <RegisterIngredientReceiptResultPage analysisId={analysisId} />;
}
