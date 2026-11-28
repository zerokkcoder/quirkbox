import { connection } from "next/server";
import { TokenCostCalculatorPage } from "@/components/sections/token-cost-calculator-page";
import { getMessages } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

const messages = getMessages("en");
export const instant = false;

export const metadata = buildMetadata({
  locale: "en",
  title: messages.tokenCostCalculator.seoTitle,
  description: messages.tokenCostCalculator.description,
  pathname: "/tools/token-cost-calculator",
  keywords: messages.tokenCostCalculator.keywords,
});

export default async function Page() {
  await connection();

  return <TokenCostCalculatorPage locale="en" messages={messages} />;
}
