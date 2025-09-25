"use client"

import React from "react"
import { BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { PerformanceData } from "./types"

interface PerformanceSectionProps {
  performanceData: PerformanceData | null
  loadingPerformance: boolean
  performanceError: string | null
  onRetry: () => void
}

export function PerformanceSection({
  performanceData,
  loadingPerformance,
  performanceError,
  onRetry
}: PerformanceSectionProps) {
  const router = useRouter()

  if (loadingPerformance) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Yükleniyor...</div>
      </div>
    )
  }

  if (performanceError) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <div className="text-sm text-muted-foreground">Şu an raporlanacak veri yok.</div>
        </div>
      </div>
    )
  }

  if (!performanceData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <div className="text-sm text-muted-foreground">Veri bulunamadı</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Performans Özeti */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Performans Özeti</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-green-600">{performanceData.completedTasks}</div>
            <div className="text-xs text-muted-foreground">Tamamlanan</div>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-blue-600">{performanceData.totalTasks}</div>
            <div className="text-xs text-muted-foreground">Toplam</div>
          </div>
        </div>
        <div className="p-3 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm">Başarı Oranı</span>
            <span className="text-lg font-bold text-purple-600">{performanceData.completionRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${performanceData.completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Takım Performansı */}
      {performanceData.teamStats.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Takım Performansı</h3>
          <div className="space-y-2">
            {performanceData.teamStats
              .sort((a, b) => b.rate - a.rate)
              .slice(0, 3)
              .map((member, index) => {
                const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500']
                return (
                  <div key={member.name} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${colors[index] || 'bg-gray-500'}`}></div>
                      <span className="text-sm truncate">{member.name}</span>
                    </div>
                    <span className="text-sm font-medium">{member.rate.toFixed(1)}%</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Proje Performansı */}
      {performanceData.projectStats.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Proje Performansı</h3>
          <div className="space-y-2">
            {performanceData.projectStats
              .sort((a, b) => b.rate - a.rate)
              .slice(0, 3)
              .map((project, index) => {
                const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500']
                return (
                  <div key={project.name} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${colors[index] || 'bg-gray-500'}`}></div>
                      <span className="text-sm truncate">{project.name}</span>
                    </div>
                    <span className="text-sm font-medium">{project.rate.toFixed(1)}%</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Detaylı Rapor İçin Buton */}
      <div className="pt-2">
        <Button 
          variant="outline" 
          className="w-full active:translate-y-[1px] active:scale-[0.99] transition-transform duration-100"
          onMouseEnter={() => router.prefetch('/dashboard/performance-reports')}
          onClick={() => router.push('/dashboard/performance-reports')}
        >
          <BarChart3 className="h-4 w-4 mr-2 transition-transform duration-150 group-active:scale-95" />
          Detaylı Raporlar
        </Button>
      </div>
    </div>
  )
}
