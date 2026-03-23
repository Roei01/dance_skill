"use client";

type PaymentErrorCardProps = {
  message: string;
};

export const PaymentErrorCard = ({ message }: PaymentErrorCardProps) => {
  return (
    <div
      className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm"
      role="alert"
      aria-live="assertive"
    >
      {message}
    </div>
  );
};
