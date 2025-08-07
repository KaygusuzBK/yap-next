"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createProject } from '../api';
import { toast } from 'sonner';

export default function NewProjectForm({ onCreated }: { onCreated?: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createProject({ title, description });
      toast.success('Proje oluşturuldu');
      setTitle('');
      setDescription('');
      onCreated?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
      <Input placeholder="Proje başlığı" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Input placeholder="Açıklama (opsiyonel)" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Button type="submit" disabled={loading}>{loading ? 'Oluşturuluyor...' : 'Ekle'}</Button>
    </form>
  );
}


