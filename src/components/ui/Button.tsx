"use client";

import { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export default function Button({ loading, className = '', children, ...props }: Props) {
  return (
    <button
      {...props}
      className={`rounded bg-black px-4 py-2 text-white disabled:opacity-60 ${className}`}
    >
      {loading ? 'Yükleniyor...' : children}
    </button>
  );
}


