"use client";

import { DocumentationAssistant } from '@/components/ai/DocumentationAssistant';
import { TeamManagement } from '@/components/ai/TeamManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, FileText, Users } from 'lucide-react';

export default function AIPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI Asistanı</h1>
          <p className="text-muted-foreground">
            Projenizi yönetmek için AI destekli araçları kullanın
          </p>
        </div>
      </div>

      <Tabs defaultValue="docs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dokümantasyon
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Takım Yönetimi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="docs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dokümantasyon Yardımcısı</CardTitle>
              <CardDescription>
                Projeniz için otomatik dokümantasyon oluşturun. AI, proje bilgilerinize göre 
                kapsamlı dokümantasyon, API kılavuzları ve kullanıcı rehberleri oluşturur.
              </CardDescription>
            </CardHeader>
          </Card>
          <DocumentationAssistant />
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Takım Yönetimi</CardTitle>
              <CardDescription>
                Takım performansınızı analiz edin ve optimizasyon önerileri alın. 
                AI, takım verilerinizi inceleyerek performans analizi, iş yükü optimizasyonu 
                ve toplantı özetleri oluşturur.
              </CardDescription>
            </CardHeader>
          </Card>
          <TeamManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

