"use client";

import { useState } from 'react';
import { useCompletion } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentationAssistantProps {
  projectData?: {
    name: string;
    description: string;
    status: string;
    team?: string;
    createdAt: string;
    tasks?: any[];
  };
}

export function DocumentationAssistant({ projectData }: DocumentationAssistantProps) {
  const [docType, setDocType] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const { completion, isLoading, complete } = useCompletion({
    api: '/api/ai/docs',
    onError: (error) => {
      toast.error('Dokümantasyon oluşturulamadı: ' + error.message);
    },
  });

  const handleGenerate = async () => {
    if (!docType) {
      toast.error('Lütfen dokümantasyon tipini seçin');
      return;
    }

    try {
      await complete('', {
        body: {
          type: docType,
          projectData: projectData || {},
          customPrompt: customPrompt
        }
      });
      toast.success('Dokümantasyon başarıyla oluşturuldu!');
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  };

  const handleCopy = async () => {
    if (completion) {
      await navigator.clipboard.writeText(completion);
      setCopied(true);
      toast.success('Dokümantasyon kopyalandı!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (completion) {
      const blob = new Blob([completion], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documentation-${docType}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Dokümantasyon indirildi!');
    }
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case 'project-docs': return 'Proje Dokümantasyonu';
      case 'api-docs': return 'API Dokümantasyonu';
      case 'user-guide': return 'Kullanıcı Kılavuzu';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AI Dokümantasyon Yardımcısı
          </CardTitle>
          <CardDescription>
            Projeniz için otomatik dokümantasyon oluşturun
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Dokümantasyon Tipi</label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger>
                <SelectValue placeholder="Dokümantasyon tipini seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project-docs">Proje Dokümantasyonu</SelectItem>
                <SelectItem value="api-docs">API Dokümantasyonu</SelectItem>
                <SelectItem value="user-guide">Kullanıcı Kılavuzu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ek Özel Talimatlar (Opsiyonel)</label>
            <Textarea
              placeholder="Dokümantasyona eklemek istediğiniz özel talimatları yazın..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isLoading || !docType}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              'Dokümantasyon Oluştur'
            )}
          </Button>
        </CardContent>
      </Card>

      {completion && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">{getDocTypeLabel(docType)}</Badge>
                  Oluşturulan Dokümantasyon
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleString('tr-TR')} tarihinde oluşturuldu
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                {completion}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
