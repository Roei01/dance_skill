import type { Metadata } from "next";
import { Rubik, Heebo } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const rubik = Rubik({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

const heebo = Heebo({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Dance Skill | Learn to Dance Online",
  description: "High-quality online dance classes. Start dancing today.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className={`${rubik.variable} ${heebo.variable} scroll-smooth`}>
      <body className="font-sans bg-white text-slate-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
