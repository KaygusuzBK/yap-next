"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(6, 'En az 6 karakter'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/dashboard');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Input label="E-posta" type="email" {...register('email')} error={errors.email?.message} />
      <Input label="Şifre" type="password" {...register('password')} error={errors.password?.message} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" loading={isSubmitting} className="w-full">Giriş Yap</Button>
    </form>
  );
}


