"use client";

type AuthErrorCardProps = {
  title: string;
  message: string;
};

export const AuthErrorCard = ({ title, message }: AuthErrorCardProps) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <h2 className="text-2xl font-black text-slate-900">{title}</h2>
      <p className="mt-3 text-base font-medium text-slate-600">{message}</p>
    </div>
  );
};
