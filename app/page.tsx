"use client";

export const dynamic = "force-dynamic";

import { Hero } from "@/sections/Hero";
import { About } from "@/sections/About";
import { Styles } from "@/sections/Styles";
import { Demo } from "@/sections/Demo";
import { Purchase } from "@/sections/Purchase";
import { Footer } from "@/sections/Footer";
import { PurchaseFaq } from "@/components/purchase/PurchaseFaq";

export default function Home() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-transparent text-slate-900 space-y-10"
    >
      <Hero />
      <Styles />
      <PurchaseFaq />
      <Footer />
    </main>
  );
}
