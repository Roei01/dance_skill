"use client";

type LoadingSpinnerProps = {
  className?: string;
  label?: string;
  fullScreen?: boolean;
};

export const LoadingSpinner = ({
  className = "",
  label,
  fullScreen = false,
}: LoadingSpinnerProps) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent ${className}`}
      />
      {label ? (
        <p className="text-sm font-medium text-slate-500">{label}</p>
      ) : null}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        {content}
      </div>
    );
  }

  return content;
};
