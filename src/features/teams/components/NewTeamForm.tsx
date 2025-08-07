"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { createTeam } from '../api';
import { toast } from 'sonner';

export default function NewTeamForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createTeam({ name });
      toast.success('Takım oluşturuldu');
      setName('');
      onCreated?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input placeholder="Takım adı" value={name} onChange={(e) => setName(e.target.value)} required />
      <Button type="submit" disabled={loading}>{loading ? 'Oluşturuluyor...' : 'Oluştur'}</Button>
    </form>
  );
}


