"use client";

import { LegalLayout } from "@/components/legal-layout";
import { APP_NAME } from "@/config";
import { Shield } from "lucide-react";

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
    content: (
      <>
        We use Polar as our merchant of record for processing payments. We do
        not collect, process, or store your credit card information directly.
        Please refer to{" "}
        <a
          href="https://polar.sh/legal/privacy-policy"
          className="font-medium text-foreground underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          Polar&apos;s privacy policy
        </a>{" "}
        for information on how they handle your payment data.
      </>
    ),
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

const UPDATES = ["2026-07-17", "2026-09-06"];

export function PrivacyView() {
  return (
    <LegalLayout
      eyebrow="Data Protection"
      eyebrowIcon={Shield}
      title="Privacy"
      highlight="Policy"
      intro={`Your privacy is incredibly important to us. We built ${APP_NAME} with privacy as a fundamental design principle.`}
      lastUpdated={new Date(UPDATES[UPDATES.length - 1])}
      sections={policies}
      footnote="If you have any questions about this Privacy Policy, please contact us via our GitHub repository or Twitter."
    />
  );
}
