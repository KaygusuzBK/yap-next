"use client";

import { forwardRef, InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, className = '', ...props },
  ref,
) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-sm text-gray-700">{label}</span>}
      <input
        ref={ref}
        className={`w-full rounded border p-2 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
});

export default Input;


