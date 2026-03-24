import type { Metadata } from "next";
import { EditorView } from "./view";

export const metadata: Metadata = {
  title: "Screenshot Editor",
  description:
    "Beautify your screenshots with gradient backgrounds, mesh gradients, shadows, noise texture, perspective tilt, and more. Export in PNG or JPG at up to 3x scale.",
  alternates: { canonical: "/editor" },
  robots: { index: true, follow: true },
};

export default function EditorPage() {
  return <EditorView />;
}
