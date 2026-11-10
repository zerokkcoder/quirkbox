import { HomePage } from "@/components/sections/home-page";
import { getMessages } from "@/lib/i18n";

export default function Page() {
  return <HomePage locale="en" messages={getMessages("en")} />;
}
