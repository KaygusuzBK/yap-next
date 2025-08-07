"use client";

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

function scorePassword(pw: string) {
  let score = 0;
  if (!pw) return 0;
  const letters: Record<string, number> = {};
  for (let i = 0; i < pw.length; i++) {
    letters[pw[i]] = (letters[pw[i]] || 0) + 1;
    score += 5.0 / letters[pw[i]];
  }
  const variations = {
    digits: /\d/.test(pw),
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    nonWords: /\W/.test(pw),
  };
  let variationCount = 0;
  for (const check in variations) variationCount += variations[check as keyof typeof variations] ? 1 : 0;
  score += (variationCount - 1) * 10;
  return Math.max(0, Math.min(100, Math.floor(score)));
}

export default function PasswordStrength({ value }: { value: string }) {
  const score = useMemo(() => scorePassword(value), [value]);
  const color = score > 70 ? 'bg-green-500' : score > 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="h-1 w-full rounded bg-muted">
      <div className={cn('h-1 rounded transition-all', color)} style={{ width: `${score}%` }} />
    </div>
  );
}


