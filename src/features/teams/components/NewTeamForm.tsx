"use client";

import { useState } from 'react';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createTeam } from '../api';
import { toast } from 'sonner';
import { Users, Plus, Image as ImageIcon } from 'lucide-react';

export default function NewTeamForm({ onCreated }: { onCreated?: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Takım adı gereklidir');
      return;
    }
    
    setLoading(true);
    try {
      await createTeam({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        avatar_url: formData.avatar_url.trim() || undefined
      });
      toast.success('Takım başarıyla oluşturuldu!');
      setFormData({ name: '', description: '', avatar_url: '' });
      setIsExpanded(false);
      onCreated?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Takım oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  if (!isExpanded) {
    return (
      <Button 
        onClick={() => setIsExpanded(true)} 
        className="w-full sm:w-auto"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        Yeni Takım Oluştur
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Yeni Takım Oluştur
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="team-name" className="text-sm font-medium">
              Takım Adı *
            </label>
            <Input
              id="team-name"
              placeholder="Takım adını girin"
              value={formData.name}
              onChange={handleInputChange('name')}
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="team-description" className="text-sm font-medium">
              Açıklama
            </label>
            <Textarea
              id="team-description"
              placeholder="Takım hakkında kısa bir açıklama (opsiyonel)"
              value={formData.description}
              onChange={handleInputChange('description')}
              rows={3}
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="team-avatar" className="text-sm font-medium">
              Avatar URL
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="team-avatar"
                placeholder="https://example.com/avatar.jpg"
                value={formData.avatar_url}
                onChange={handleInputChange('avatar_url')}
                className="pl-10"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Takım için bir avatar resmi ekleyebilirsiniz
            </p>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button 
              type="submit" 
              disabled={loading || !formData.name.trim()}
              className="flex-1"
            >
              {loading ? 'Oluşturuluyor...' : 'Takım Oluştur'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsExpanded(false)}
              disabled={loading}
            >
              Vazgeç
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


