"use client";

export const dynamic = "force-dynamic";

import { Hero } from "@/sections/Hero";
import { About } from "@/sections/About";
import { Styles } from "@/sections/Styles";
import { Footer } from "@/sections/Footer";
import { PurchaseFaq } from "@/components/purchase/PurchaseFaq";

export default function Home() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-transparent text-slate-900"
    >
      <Hero />
      <Styles />
      <div className="pb-10 md:pb-10">
        <PurchaseFaq />
      </div>
      <Footer />
    </main>
  );
}
