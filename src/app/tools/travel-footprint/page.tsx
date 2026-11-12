import { TravelFootprintPage } from "@/components/sections/travel-footprint-page";
import { getMessages } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

const messages = getMessages("en");
export const instant = false;

export const metadata = buildMetadata({
  locale: "en",
  title: messages.travelFootprint.title,
  description: messages.travelFootprint.description,
  pathname: "/tools/travel-footprint",
  keywords: ["travel footprint map", "travel map generator", "map route visualizer"],
});

export default function Page() {
  return <TravelFootprintPage locale="en" messages={messages} />;
}
