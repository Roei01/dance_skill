import type { Metadata } from "next";
import { Rubik, Heebo } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

export const dynamic = "force-dynamic";

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-sans",
});

const heebo = Heebo({
  subsets: ["latin", "hebrew"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Dance Skill | לימודי ריקוד אונליין",
  description: "שיעורי ריקוד אונליין ברמה גבוהה עם חוויית למידה מקצועית וברורה.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${rubik.variable} ${heebo.variable} scroll-smooth`}
    >
      <body className="font-sans bg-white text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
