import { supabase } from "./client";

type OAuthProvider = "google";
interface OAuthOptions {
  redirectTo?: string;
  onError?: (error: any) => void;
  onStarting?: () => void;
  queryParams?: { [key: string]: string };
  scopes?: string;
  skipBrowserRedirect?: boolean;
}
export const createOAuth = async (
  provider: OAuthProvider,
  options?: OAuthOptions,
) => {
  options?.onStarting?.();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: options?.redirectTo,
      queryParams: options?.queryParams,
      scopes: options?.scopes,
      skipBrowserRedirect: options?.skipBrowserRedirect,
    },
  });
  if (error && options?.onError) {
    options.onError(error);
  }
};
