import { ToolsPage } from "@/components/sections/tools-page";
import { getMessages } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

const messages = getMessages("en");

export const metadata = buildMetadata({
  locale: "en",
  title: messages.tools.title,
  description: messages.tools.description,
  pathname: "/tools",
  keywords: ["fun tools", "online generators", "random generator tools"],
});

export default function Page() {
  return <ToolsPage locale="en" messages={messages} />;
}
