import { AboutPage } from "@/components/sections/about-page";
import { getMessages } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

const messages = getMessages("en");

export const metadata = buildMetadata({
  locale: "en",
  title: messages.about.title,
  description: messages.about.description,
  pathname: "/about",
  keywords: ["quirkbox", "fun tool collection", "generator site"],
});

export default function Page() {
  return <AboutPage locale="en" messages={messages} />;
}
