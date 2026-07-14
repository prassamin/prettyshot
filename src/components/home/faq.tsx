"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Sparkles, Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "Is PrettyShot really free?",
    a: "Yes! The core editor is completely free — no signup required. We offer a Pro tier for those who want to remove watermarks and access premium features like cloud sync and custom backgrounds.",
  },
  {
    q: "Do I need to create an account?",
    a: "Nope. Just open the editor and start beautifying. Your images are processed entirely in your browser — nothing is uploaded to any server.",
  },
  {
    q: "Where are my screenshots stored?",
    a: "Nowhere! Everything happens client-side in your browser. We never see, store, or transmit your images. Your data stays on your device.",
  },
  {
    q: "What export formats are supported?",
    a: "You can export as PNG (lossless, with transparency support) or JPG (smaller file size). Both support 1×, 2×, and 3× scale for retina displays.",
  },
  {
    q: "Can I use the exports commercially?",
    a: "Absolutely. Use your beautified screenshots for product pages, social media, documentation, pitch decks, blog posts — anywhere you want.",
  },
  {
    q: "What image formats can I upload?",
    a: "PNG, JPG, and WebP. Just drag & drop, paste from clipboard (Ctrl/Cmd+V), or use the file picker.",
  },
];

function FaqItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: (typeof faqs)[number];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <button
        onClick={onToggle}
        className="group flex w-full items-start gap-4 rounded-2xl border border-zinc-200/60 bg-white px-6 py-5 text-left transition-all duration-300 hover:border-zinc-300/80 hover:shadow-lg hover:shadow-orange-100/30"
      >
        {/* Toggle icon */}
        <div
          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-300"
          style={{
            backgroundColor: isOpen ? "#fb923c" : "#f4f4f5",
          }}
        >
          {isOpen ? (
            <Minus className="size-3.5 text-white" strokeWidth={2.5} />
          ) : (
            <Plus className="size-3.5 text-zinc-400" strokeWidth={2.5} />
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-[15px] font-bold text-zinc-900">{faq.q}</h3>

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {faq.a}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </button>
    </motion.div>
  );
}

export function Faq() {
  const [openIndex, setOpenIndex] = useState(0);
  const headingRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-100px" });

  return (
    <section id="faq" className="relative overflow-hidden bg-[#faf8f6] py-24 sm:py-32">
      {/* Decorative */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-20 right-1/4 size-100 rounded-full bg-orange-100/40 blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 size-100 rounded-full bg-violet-100/30 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-5">
        {/* Heading */}
        <motion.div
          ref={headingRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headingInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-500 shadow-sm ring-1 ring-zinc-200/80">
            <Sparkles className="size-3 text-orange-400" />
            FAQ
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Got questions?
          </h2>
        </motion.div>

        {/* FAQ list */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FaqItem
              key={i}
              faq={faq}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
