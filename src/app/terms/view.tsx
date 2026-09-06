"use client";

import { LegalLayout } from "@/components/legal-layout";
import { APP_NAME } from "@/config";
import { FileText } from "lucide-react";

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

const UPDATES = ["2026-07-17", "2026-09-06"];

export function TermsView() {
  return (
    <LegalLayout
      eyebrow="Legal Agreement"
      eyebrowIcon={FileText}
      title="Terms of"
      highlight="Service"
      intro={`Welcome to ${APP_NAME}. These terms govern your use of our platform. We've kept them as simple and transparent as possible.`}
      lastUpdated={new Date(UPDATES[UPDATES.length - 1])}
      sections={terms}
      footnote="If you have any questions about these Terms, please contact us via our GitHub repository or Twitter."
    />
  );
}
