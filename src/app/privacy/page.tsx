import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { APP_NAME } from "@/config";
import { metatag } from "@/lib/metatag";
import { Shield } from "lucide-react";

export const generateMetadata = () => {
  return metatag({
    title: `Privacy Policy`,
    description: "Privacy Policy and data handling practices for PrettyShot.",
  });
};

const policies = [
  {
    title: "Local Processing (Free Users)",
    content: `If you are using the free version of ${APP_NAME} without an account, your images never leave your device. The entire beautification and export process happens strictly client-side within your browser using Web APIs. We do not transmit, view, store, or have any access to the screenshots you edit.`,
  },
  {
    title: "Cloud Sync (Pro Users)",
    content: `If you create an account and upgrade to ${APP_NAME} Pro, you gain access to Cloud Sync. In this case, we securely transmit and store your images and design configurations on our database. This data is stored strictly to allow you to access your designs across multiple devices. You retain full ownership of your data, and we do not use your images to train AI models or sell them to third parties.`,
  },
  {
    title: "Authentication Data",
    content: `If you create an account, we store your email address and authentication credentials securely using Supabase Auth. This data is used solely to authenticate you and sync your purchases and designs.`,
  },
  {
    title: "Payment Information",
    content: `We use Polar as our merchant of record for processing payments. We do not collect, process, or store your credit card information directly. Please refer to <a href="https://polar.sh/legal/privacy-policy" style="text-decoration: underline; color="#000">Polar's privacy policy</a> for information on how they handle your payment data.`,
  },
  {
    title: "Analytics",
    content: `We may use privacy-friendly analytics tools to collect anonymized usage data (such as page views or button clicks) to help us improve the product. We do not track individual users across the web or sell any analytics data.`,
  },
  {
    title: "Deleting Your Data",
    content: `Pro users can request complete deletion of their account and all associated cloud-synced images by contacting our support. Free users do not need to request deletion, as all data is stored exclusively in your browser's local storage and can be cleared by clearing your browser cache.`,
  },
  {
    title: "Changes to Privacy Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy on this page and updating the "Last updated" date.`,
  },
];

export default function PrivacyPolicy() {
  const lastUpdated = "July 17, 2026";

  return (
    <main className="min-h-screen bg-[#faf8f6] selection:bg-violet-200 selection:text-violet-900">
      <Navbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
        {/* Background Accents */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="absolute top-[-10%] h-125 w-125 rounded-full bg-linear-to-br from-violet-200/40 via-fuchsia-200/20 to-transparent blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-1.5 text-sm font-semibold text-violet-600 shadow-sm ring-1 ring-violet-200/50 backdrop-blur-md">
            <Shield className="size-4" />
            Data Protection
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl">
            Privacy{" "}
            <span className="bg-linear-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-500">
            Your privacy is incredibly important to us. We built {APP_NAME} with
            privacy as a fundamental design principle.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-zinc-400">
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mx-auto max-w-4xl px-6 pb-32">
        <div className="rounded-3xl border border-zinc-200/60 bg-white/60 p-6 shadow-xl shadow-zinc-200/40 backdrop-blur-xl sm:p-10 md:p-12">
          <div className="mb-12 rounded-2xl bg-violet-50/50 p-6 text-zinc-700 ring-1 ring-violet-100/50">
            <p className="leading-relaxed font-medium">
              TL;DR: If you use the free version, everything happens locally on
              your device and we see nothing. If you upgrade to Pro, we securely
              sync your data so you can access it anywhere, but we never sell it
              or use it to train AI.
            </p>
          </div>

          <div className="space-y-12">
            {policies.map((policy, index) => {
              return (
                <div
                  key={index}
                  className="flex flex-col gap-4 sm:flex-row sm:gap-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900">
                      {index + 1}. {policy.title}
                    </h2>
                    <p
                      className="mt-3 leading-relaxed text-zinc-600"
                      dangerouslySetInnerHTML={{ __html: policy.content }}
                    ></p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-16 border-t border-zinc-200/60 pt-8 text-center text-sm text-zinc-500">
            <p>
              If you have any questions about this Privacy Policy, please
              contact us via our GitHub repository or Twitter.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
