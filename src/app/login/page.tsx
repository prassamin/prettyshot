import { metatag } from "@/lib/metatag";
import LoginPageView from "./view";

export default function LoginPage() {
  return <LoginPageView />;
}

export async function generateMetadata() {
  return metatag({
    title: "Login",
  })
}