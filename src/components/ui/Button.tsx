"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-palestine-green text-white hover:bg-palestine-green-dark focus:ring-palestine-green",
  secondary:
    "bg-palestine-red text-white hover:bg-palestine-red-dark focus:ring-palestine-red",
  outline:
    "border-2 border-palestine-green text-palestine-green hover:bg-palestine-green hover:text-white focus:ring-palestine-green",
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
