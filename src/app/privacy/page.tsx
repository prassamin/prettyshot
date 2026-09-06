import { metatag } from "@/lib/metatag";
import { PrivacyView } from "./view";

export const generateMetadata = () => {
  return metatag({
    title: "Privacy Policy",
    description: "Privacy Policy and data handling practices for PrettyShot.",
  });
};

export default function PrivacyPolicy() {
  return <PrivacyView />;
}
