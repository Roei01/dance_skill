"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

type HostedPurchaseConfirmationProps = {
  email?: string;
  method?: string;
};

export function HostedPurchaseConfirmation({
  email,
  method,
}: HostedPurchaseConfirmationProps) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!email || method !== "hosted") {
      return;
    }

    let cancelled = false;

    void api
      .post("/purchase/hosted/confirm", { email })
      .then((response) => {
        if (cancelled) {
          return;
        }

        if (response.data?.alreadyCompleted) {
          setMessage("הגישה כבר עודכנה עבורך ונשלחה למייל.");
          return;
        }

        setMessage("הגישה עודכנה בהצלחה ונשלחה למייל.");
      })
      .catch(() => {
        if (!cancelled) {
          setMessage("אנחנו עדיין משלימים את פתיחת הגישה. אם לא יגיע מייל בקרוב, אפשר לנסות שוב בעוד רגע.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [email, method]);

  if (!message) {
    return null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-700">
      {message}
    </div>
  );
}
