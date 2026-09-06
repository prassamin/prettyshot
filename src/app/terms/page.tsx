import { metatag } from "@/lib/metatag";
import { TermsView } from "./view";

export const generateMetadata = () => {
  return metatag({
    title: "Terms of Service",
    description: "Terms of Service and conditions of use for PrettyShot.",
  });
};

export default function TermsOfService() {
  return <TermsView />;
}
