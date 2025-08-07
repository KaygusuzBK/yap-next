"use client";

import { useEffect, useState } from 'react';
import { fetchProjects, type Project } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProjectList({ refreshKey }: { refreshKey?: number }) {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchProjects();
        setItems(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  if (loading) return <p className="text-sm text-muted-foreground">Yükleniyor...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!items.length) return <p className="text-sm text-muted-foreground">Henüz proje yok.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((p) => (
        <Card key={p.id}>
          <CardHeader>
            <CardTitle className="text-base">{p.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {p.description || 'Açıklama yok'}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


