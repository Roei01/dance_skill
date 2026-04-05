"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { BUSINESS_NAME } from "@/lib/business-info";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_45%,#fff5ef_100%)] px-4 py-6 text-slate-900 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-[2rem] bg-white px-5 py-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:px-8"
        >
          <div className="text-center">
            <p className="text-sm font-semibold tracking-[0.16em] text-slate-500">
              {BUSINESS_NAME}
            </p>
            <p className="mt-2 text-base font-medium leading-7 text-slate-600 md:text-lg">
              {subtitle}
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              {title}
            </h1>
          </div>

          {children}

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 transition hover:text-slate-700"
            >
              חזרה לעמוד הבית
            </Link>
          </div>

          {footer ? <div className="mt-4">{footer}</div> : null}
        </motion.div>
      </div>
    </main>
  );
}
