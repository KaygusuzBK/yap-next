"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { getSupabase } from '@/lib/supabase';
import { useState } from 'react';

const schema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter'),
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(6, 'En az 6 karakter'),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterForm() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values: FormValues) => {
    setStatus(null);
    setError(null);
    const supabase = getSupabase();
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { name: values.name }, emailRedirectTo: `${window.location.origin}/login` }
    });
    if (error) {
      setError(error.message);
      return;
    }
    setStatus('Kayıt başarılı. Lütfen e-postanızı doğrulayın.');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Input label="İsim" type="text" {...register('name')} error={errors.name?.message} />
      <Input label="E-posta" type="email" {...register('email')} error={errors.email?.message} />
      <Input label="Şifre" type="password" {...register('password')} error={errors.password?.message} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {status && <p className="text-sm text-green-600">{status}</p>}
      <Button type="submit" loading={isSubmitting} className="w-full">Kayıt Ol</Button>
    </form>
  );
}


