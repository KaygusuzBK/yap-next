"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { MagicLinkInline } from './MagicLink';

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(6, 'En az 6 karakter').optional(),
});

type FormValues = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values: FormValues) => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Giriş başarılı');
    router.replace('/dashboard');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-posta</FormLabel>
              <FormControl>
                <Input type="email" placeholder="ornek@mail.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Şifre alanı kaldırıldı */}
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </Button>
        {/* Magic link tetikleyici */}
        <div className="pt-2">
          <MagicLinkInline email={form.watch('email') || ''} />
        </div>
      </form>
    </Form>
  );
}


