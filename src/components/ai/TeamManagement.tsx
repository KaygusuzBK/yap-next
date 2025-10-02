"use client";

import { useState } from 'react';
import { useCompletion } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Users, BarChart3, Download, Copy, Check, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface TeamManagementProps {
  teamData?: {
    name: string;
    memberCount: number;
    activeProjects: number;
    completedTasks: number;
    avgTaskDuration?: string;
    productivity?: string;
    members?: Array<{
      name: string;
      activeTasks: number;
      completedTasks: number;
    }>;
  };
}

export function TeamManagement({ teamData }: TeamManagementProps) {
  const [analysisType, setAnalysisType] = useState<string>('');
  const [meetingData, setMeetingData] = useState({
    topic: '',
    participants: '',
    duration: '',
    date: '',
    agenda: '',
    decisions: '',
    actionItems: ''
  });
  const [copied, setCopied] = useState(false);

  const { completion, isLoading, complete } = useCompletion({
    api: '/api/ai/team-analysis',
    onError: (error) => {
      toast.error('Analiz oluşturulamadı: ' + error.message);
    },
  });

  const handleGenerate = async () => {
    if (!analysisType) {
      toast.error('Lütfen analiz tipini seçin');
      return;
    }

    try {
      await complete('', {
        body: {
          type: analysisType,
          teamData: teamData || {},
          meetingData: analysisType === 'meeting-summary' ? meetingData : undefined
        }
      });
      toast.success('Analiz başarıyla oluşturuldu!');
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  };

  const handleCopy = async () => {
    if (completion) {
      await navigator.clipboard.writeText(completion);
      setCopied(true);
      toast.success('Analiz kopyalandı!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (completion) {
      const blob = new Blob([completion], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team-analysis-${analysisType}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Analiz indirildi!');
    }
  };

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'performance-analysis': return 'Performans Analizi';
      case 'workload-optimization': return 'İş Yükü Optimizasyonu';
      case 'meeting-summary': return 'Toplantı Özeti';
      default: return type;
    }
  };

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'performance-analysis': return <BarChart3 className="h-5 w-5" />;
      case 'workload-optimization': return <Users className="h-5 w-5" />;
      case 'meeting-summary': return <Calendar className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            AI Takım Yönetimi
          </CardTitle>
          <CardDescription>
            Takım performansını analiz edin ve optimizasyon önerileri alın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Analiz Tipi</label>
            <Select value={analysisType} onValueChange={setAnalysisType}>
              <SelectTrigger>
                <SelectValue placeholder="Analiz tipini seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance-analysis">Performans Analizi</SelectItem>
                <SelectItem value="workload-optimization">İş Yükü Optimizasyonu</SelectItem>
                <SelectItem value="meeting-summary">Toplantı Özeti</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {analysisType === 'meeting-summary' && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">Toplantı Bilgileri</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Toplantı Konusu</label>
                  <Input
                    placeholder="Toplantı konusu..."
                    value={meetingData.topic}
                    onChange={(e) => setMeetingData(prev => ({ ...prev, topic: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Katılımcılar</label>
                  <Input
                    placeholder="Katılımcı isimleri..."
                    value={meetingData.participants}
                    onChange={(e) => setMeetingData(prev => ({ ...prev, participants: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Süre</label>
                  <Input
                    placeholder="Örn: 1 saat"
                    value={meetingData.duration}
                    onChange={(e) => setMeetingData(prev => ({ ...prev, duration: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tarih</label>
                  <Input
                    placeholder="Örn: 15 Aralık 2024"
                    value={meetingData.date}
                    onChange={(e) => setMeetingData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Gündem Maddeleri</label>
                <Textarea
                  placeholder="Gündem maddelerini yazın..."
                  value={meetingData.agenda}
                  onChange={(e) => setMeetingData(prev => ({ ...prev, agenda: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Alınan Kararlar</label>
                <Textarea
                  placeholder="Alınan kararları yazın..."
                  value={meetingData.decisions}
                  onChange={(e) => setMeetingData(prev => ({ ...prev, decisions: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Aksiyon Maddeleri</label>
                <Textarea
                  placeholder="Aksiyon maddelerini yazın..."
                  value={meetingData.actionItems}
                  onChange={(e) => setMeetingData(prev => ({ ...prev, actionItems: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={isLoading || !analysisType}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analiz Ediliyor...
              </>
            ) : (
              <>
                {getAnalysisIcon(analysisType)}
                <span className="ml-2">Analiz Oluştur</span>
              </>
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
                  <Badge variant="secondary">{getAnalysisTypeLabel(analysisType)}</Badge>
                  Analiz Sonucu
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
