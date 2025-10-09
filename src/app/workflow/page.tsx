'use client';

import React, { useState } from 'react';
import { Canvas } from '@/components/ai-elements/canvas';
import { Connection } from '@/components/ai-elements/connection';
import { Controls } from '@/components/ai-elements/controls';
import { Edge } from '@/components/ai-elements/edge';
import {
  Node,
  NodeContent,
  NodeDescription,
  NodeFooter,
  NodeHeader,
  NodeTitle,
} from '@/components/ai-elements/node';
import { Panel } from '@/components/ai-elements/panel';
import { Toolbar } from '@/components/ai-elements/toolbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Settings, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  Database
} from 'lucide-react';
import DashboardHeader from '@/components/layout/DashboardHeader';

const nodeIds = {
  start: 'start',
  process1: 'process1',
  process2: 'process2',
  decision: 'decision',
  output1: 'output1',
  output2: 'output2',
  complete: 'complete',
};

const nodes = [
  {
    id: nodeIds.start,
    type: 'workflow',
    position: { x: 0, y: 0 },
    data: {
      label: '🚀 Workflow Başlat',
      description: 'Kullanıcı aksiyonu ile tetiklenir',
      handles: { target: false, source: true },
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <span className="text-sm">09:30 AM&apos;de tetiklendi</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-sm">Kullanıcı: Ahmet Yılmaz</span>
          </div>
        </div>
      ),
      footer: 'Durum: Hazır',
    },
  },
  {
    id: nodeIds.process1,
    type: 'workflow',
    position: { x: 500, y: 0 },
    data: {
      label: '📊 Veri İşleme',
      description: 'Giriş verilerini dönüştür',
      handles: { target: true, source: true },
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-500" />
            <span className="text-sm">1,234 kayıt doğrulanıyor</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">İş kuralları uygulanıyor</span>
          </div>
        </div>
      ),
      footer: 'Süre: ~2.5s',
    },
  },
  {
    id: nodeIds.decision,
    type: 'workflow',
    position: { x: 1000, y: 0 },
    data: {
      label: '🤔 Karar Noktası',
      description: 'Koşullara göre yönlendir',
      handles: { target: true, source: true },
      content: (
        <div className="space-y-2">
          <div className="text-sm font-mono bg-muted p-2 rounded">
            data.status === &apos;valid&apos; && data.score &gt; 0.8
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm">Güven: %94</span>
          </div>
        </div>
      ),
      footer: 'Sonraki: Koşul değerlendirmesi',
    },
  },
  {
    id: nodeIds.output1,
    type: 'workflow',
    position: { x: 1500, y: -300 },
    data: {
      label: '✅ Başarı Yolu',
      description: 'Başarılı durumu işle',
      handles: { target: true, source: true },
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">1,156 kayıt geçti (%93.7)</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm">Performans: Mükemmel</span>
          </div>
        </div>
      ),
      footer: 'Sonraki: Üretime gönder',
    },
  },
  {
    id: nodeIds.output2,
    type: 'workflow',
    position: { x: 1500, y: 300 },
    data: {
      label: '⚠️ Hata Yolu',
      description: 'Hata durumunu işle',
      handles: { target: true, source: true },
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm">78 kayıt başarısız (%6.3)</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="text-sm">İnceleme için kuyruğa alındı</span>
          </div>
        </div>
      ),
      footer: 'Sonraki: İnceleme için kuyruk',
    },
  },
  {
    id: nodeIds.complete,
    type: 'workflow',
    position: { x: 2000, y: 0 },
    data: {
      label: '🎯 Tamamlandı',
      description: 'Workflow\'u sonlandır',
      handles: { target: true, source: false },
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Tüm kayıtlar işlendi</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm">Başarı oranı: %93.7</span>
          </div>
        </div>
      ),
      footer: 'Toplam süre: 4.2s',
    },
  },
];

const edges = [
  {
    id: 'edge1',
    source: nodeIds.start,
    target: nodeIds.process1,
    type: 'animated',
  },
  {
    id: 'edge2',
    source: nodeIds.process1,
    target: nodeIds.decision,
    type: 'animated',
  },
  {
    id: 'edge3',
    source: nodeIds.decision,
    target: nodeIds.output1,
    type: 'animated',
  },
  {
    id: 'edge4',
    source: nodeIds.decision,
    target: nodeIds.output2,
    type: 'temporary',
  },
  {
    id: 'edge5',
    source: nodeIds.output1,
    target: nodeIds.complete,
    type: 'animated',
  },
  {
    id: 'edge6',
    source: nodeIds.output2,
    target: nodeIds.complete,
    type: 'temporary',
  },
];

const nodeTypes = {
  workflow: ({
    data,
  }: {
    data: {
      label: string;
      description: string;
      handles: { target: boolean; source: boolean };
      content: React.ReactNode;
      footer: string;
    };
  }) => (
    <div className="group">
      <NodeHeader>
        <NodeTitle>{data.label}</NodeTitle>
        <NodeDescription>{data.description}</NodeDescription>
      </NodeHeader>
      <NodeContent>
        {data.content}
      </NodeContent>
      <NodeFooter>
        <p className="text-muted-foreground text-xs">{data.footer}</p>
      </NodeFooter>
      <Toolbar>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
          <Settings className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-700">
          ×
        </Button>
      </Toolbar>
    </div>
  ),
};

const edgeTypes = {
  animated: Edge.Animated,
  temporary: Edge.Temporary,
};

export default function WorkflowPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [workflowStats, setWorkflowStats] = useState({
    totalExecutions: 1247,
    successRate: 93.7,
    avgDuration: 4.2,
    activeWorkflows: 3,
  });

  return (
    <div className="h-screen flex flex-col">
      <DashboardHeader
        title="AI Workflow Yönetimi"
        actions={
          <div className="flex gap-2">
            <Button
              variant={isPlaying ? "destructive" : "default"}
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? 'Durdur' : 'Başlat'}
            </Button>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Sıfırla
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Dışa Aktar
            </Button>
          </div>
        }
      />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r border-border bg-muted/30 p-4 space-y-4">
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stats">İstatistikler</TabsTrigger>
              <TabsTrigger value="nodes">Düğümler</TabsTrigger>
              <TabsTrigger value="settings">Ayarlar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Workflow İstatistikleri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Toplam Çalıştırma</span>
                    <Badge variant="secondary">{workflowStats.totalExecutions}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Başarı Oranı</span>
                    <Badge variant="default">{workflowStats.successRate}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Ortalama Süre</span>
                    <Badge variant="outline">{workflowStats.avgDuration}s</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Aktif Workflow</span>
                    <Badge variant="destructive">{workflowStats.activeWorkflows}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Son Aktiviteler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Workflow başarıyla tamamlandı</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Yeni düğüm eklendi</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Workflow güncellendi</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="nodes" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Düğüm Kütüphanesi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-2 border border-border rounded cursor-pointer hover:bg-muted">
                    <div className="font-medium text-sm">🚀 Başlat</div>
                    <div className="text-xs text-muted-foreground">Workflow başlatma düğümü</div>
                  </div>
                  <div className="p-2 border border-border rounded cursor-pointer hover:bg-muted">
                    <div className="font-medium text-sm">📊 İşlem</div>
                    <div className="text-xs text-muted-foreground">Veri işleme düğümü</div>
                  </div>
                  <div className="p-2 border border-border rounded cursor-pointer hover:bg-muted">
                    <div className="font-medium text-sm">🤔 Karar</div>
                    <div className="text-xs text-muted-foreground">Koşullu karar düğümü</div>
                  </div>
                  <div className="p-2 border border-border rounded cursor-pointer hover:bg-muted">
                    <div className="font-medium text-sm">🎯 Bitiş</div>
                    <div className="text-xs text-muted-foreground">Workflow sonlandırma</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Görünüm Ayarları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Animasyonlar</span>
                    <Button size="sm" variant="outline">Açık</Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Grid Göster</span>
                    <Button size="sm" variant="outline">Kapalı</Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Minimap</span>
                    <Button size="sm" variant="outline">Açık</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Canvas */}
        <div className="flex-1">
          <Canvas
            edges={edges}
            edgeTypes={edgeTypes}
            fitView
            nodes={nodes}
            nodeTypes={nodeTypes}
            connectionLineComponent={Connection}
          >
            <Controls />
            <Panel position="top-right">
              <div className="flex gap-2">
                <Button size="sm" variant="secondary">
                  <Download className="h-4 w-4 mr-2" />
                  PNG
                </Button>
                <Button size="sm" variant="secondary">
                  <Download className="h-4 w-4 mr-2" />
                  SVG
                </Button>
              </div>
            </Panel>
          </Canvas>
        </div>
      </div>
    </div>
  );
}
