import type { Metadata } from "next";
import { Rubik, Heebo } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

export const dynamic = "force-dynamic";

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-heading",
});

const heebo = Heebo({
  subsets: ["latin", "hebrew"],
  variable: "--font-body",
});

const siteUrl = process.env.APP_BASE_URL || "https://rbdt-online.onrender.com";
const ogImageUrl = `${siteUrl}/opengraph-image`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ROTEM BARUCH dance tutorials",
  description: "מודרני פיוז׳ן אונליין עם רותם ברוך בואו לרקוד איתי בכל מקום בכל זמן :)",
  openGraph: {
    title: "ROTEM BARUCH dance tutorials",
    description:
      "מודרני פיוז׳ן אונליין עם רותם ברוך בואו לרקוד איתי בכל מקום בכל זמן :)",
    type: "website",
    url: siteUrl,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "ROTEM BARUCH dance tutorials",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ROTEM BARUCH dance tutorials",
    description:
      "מודרני פיוז׳ן אונליין עם רותם ברוך בואו לרקוד איתי בכל מקום בכל זמן :)",
    images: [ogImageUrl],
  },
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
        <a href="#main-content" className="skip-link">
          דלגי לתוכן הראשי
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
