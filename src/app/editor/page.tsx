import { APP_NAME } from "@/config";
import { EditorView } from "./view";
import { metatag } from "@/lib/metatag";

export const generateMetadata = () => {
  return metatag({
    title: `Editor | ${APP_NAME}`,
    description:
      "Beautify your screenshots with gradient backgrounds, mesh gradients, shadows, noise texture, perspective tilt, and more. Export in PNG or JPG at up to 3x scale.",
  });
};

export default function EditorPage() {
  return <EditorView />;
}
