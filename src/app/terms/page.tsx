import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { APP_NAME } from "@/config";
import { metatag } from "@/lib/metatag";
import { FileText } from "lucide-react";

export const generateMetadata = () => {
  return metatag({
    title: `Terms of Service`,
    description: "Terms of Service and conditions of use for PrettyShot.",
  });
};

const terms = [
  {
    title: "Description of Service",
    content: `${APP_NAME} is a web-based design tool that allows users to create, beautify, and export mockup images of screenshots. The service is provided under a freemium model. Basic features are provided free of charge, while advanced features (including cloud synchronization) are available via a paid "Pro" upgrade.`,
  },
  {
    title: "License to Use",
    content: `Any images, mockups, or exported files you create using ${APP_NAME} are yours to keep. You are granted a worldwide, royalty-free license to use the exported images for any commercial or non-commercial purpose.`,
  },
  {
    title: "Pro Upgrades and Refunds",
    content: `Our "Pro" tier is offered as a one-time lifetime payment. By purchasing a Pro upgrade, you gain access to premium features for the lifetime of the product. Due to the digital nature of the service, all sales are final, but we may offer refunds at our sole discretion if requested within 14 days of purchase and if the service was substantially unused.`,
  },
  {
    title: "User Data and Cloud Sync",
    content: `Free users operate the application entirely client-side. We do not store or transmit your images. For Pro users utilizing Cloud Sync, images and design configurations are securely stored on our servers to enable cross-device access. You retain full ownership of any data uploaded to your account.`,
  },
  {
    title: "Acceptable Use",
    content: `You agree not to use the service to generate illegal, hateful, or abusive content. We reserve the right to suspend or terminate accounts that violate these terms, without prior notice or liability.`,
  },
  {
    title: "Changes to Terms",
    content: `We reserve the right to modify these terms at any time. We will notify users of any material changes by updating the "Last updated" date at the top of this page. Your continued use of the service after such modifications constitutes acceptance of the new terms.`,
  },
];

export default function TermsOfService() {
  const lastUpdated = "July 17, 2026";

  return (
    <main className="min-h-screen bg-[#faf8f6] selection:bg-rose-200 selection:text-rose-900">
      <Navbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
        {/* Background Accents */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="absolute top-[-10%] h-125 w-125 rounded-full bg-linear-to-br from-orange-200/40 via-rose-200/20 to-transparent blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-1.5 text-sm font-semibold text-rose-600 shadow-sm ring-1 ring-rose-200/50 backdrop-blur-md">
            <FileText className="size-4" />
            Legal Agreement
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl">
            Terms of{" "}
            <span className="bg-linear-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
              Service
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-500">
            Welcome to {APP_NAME}. These terms govern your use of our platform.
            We&apos;ve kept them as simple and transparent as possible.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-zinc-400">
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mx-auto max-w-4xl px-6 pb-32">
        <div className="rounded-3xl border border-zinc-200/60 bg-white/60 p-6 shadow-xl shadow-zinc-200/40 backdrop-blur-xl sm:p-10 md:p-12">
          <div className="mb-12 rounded-2xl bg-orange-50/50 p-6 text-zinc-700 ring-1 ring-orange-100/50">
            <p className="leading-relaxed">
              By accessing or using our website and services, you agree to be
              bound by these Terms of Service. If you disagree with any part of
              the terms, you may not access the service.
            </p>
          </div>

          <div className="space-y-12">
            {terms.map((term, index) => {
              return (
                <div
                  key={index}
                  className="flex flex-col gap-4 sm:flex-row sm:gap-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900">
                      {index + 1}. {term.title}
                    </h2>
                    <p className="mt-3 leading-relaxed text-zinc-600">
                      {term.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-16 border-t border-zinc-200/60 pt-8 text-center text-sm text-zinc-500">
            <p>
              If you have any questions about these Terms, please contact us via
              our GitHub repository or Twitter.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
