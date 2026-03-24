import type { Metadata } from "next";
import { EditorView } from "./view";

export const metadata: Metadata = {
  title: "Editor — PrettyShot",
  description: "Beautify your screenshots with gradients, shadows, frames, and more.",
};

export default function EditorPage() {
  return <EditorView />;
}
