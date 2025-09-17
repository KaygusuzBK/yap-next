"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, fetchRecentActivities, formatActivityMessage, getActivityIcon } from "@/lib/services/activities/activityService";
import { Clock, User, Folder, CheckSquare } from "lucide-react";
import Link from "next/link";

interface RecentActivitiesProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
  compact?: boolean;
}

export default function RecentActivities({ 
  limit = 10, 
  showHeader = true,
  className = "",
  compact = false,
}: RecentActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadActivities() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchRecentActivities(limit);
        setActivities(data);
      } catch (err) {
        console.error('Error loading activities:', err);
        setError('Aktiviteler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    loadActivities();
  }, [limit]);

  function formatTimeAgo(dateString: string): string {
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime())) / 1000;

    if (diffInSeconds < 60) {
      return 'Az önce';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} dakika önce`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} saat önce`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} gün önce`;
    } else {
      return activityDate.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }

  function getActivityLink(activity: Activity): string {
    if (activity.task_id) {
      return `/dashboard/tasks/${activity.task_id}`;
    } else if (activity.project_id) {
      return `/dashboard/projects/${activity.project_id}`;
    }
    return '#';
  }

  function getActivityBadgeVariant(activity: Activity): "default" | "secondary" | "destructive" | "outline" {
    switch (activity.type) {
      case 'task_completed':
        return 'default';
      case 'task_created':
        return 'secondary';
      case 'task_comment':
      case 'project_comment':
        return 'outline';
      default:
        return 'outline';
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Son Aktiviteler
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={compact ? "space-y-3 p-3" : "space-y-4" }>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={compact ? "flex items-start gap-2" : "flex items-start gap-3"}>
              <Skeleton className={compact ? "h-6 w-6 rounded-full" : "h-8 w-8 rounded-full"} />
              <div className="flex-1 space-y-2">
                <Skeleton className={compact ? "h-3.5 w-3/4" : "h-4 w-3/4"} />
                <Skeleton className={compact ? "h-3 w-1/2" : "h-3 w-1/2"} />
              </div>
              <Skeleton className={compact ? "h-3.5 w-14" : "h-4 w-16"} />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Son Aktiviteler
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center text-sm text-muted-foreground py-4">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Son Aktiviteler
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center text-sm text-muted-foreground py-4">
            Henüz aktivite bulunmuyor
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} h-full flex flex-col`}>
      {showHeader && (
        <CardHeader className="flex-shrink-0 h-0">
          <CardTitle className={compact ? "flex items-center gap-2 text-sm" : "flex items-center gap-2"}>
            <Clock className={compact ? "h-4 w-4" : "h-5 w-5"} />
            Son Aktiviteler
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={`${compact ? "space-y-2.5 p-2" : "space-y-2"} flex-1 overflow-y-auto`}>
        {activities.map((activity) => (
          <Link
            key={activity.id}
            href={getActivityLink(activity)}
            className={compact ? "block group hover:bg-muted/50 rounded-md p-1.5 transition-colors" : "block group hover:bg-muted/50 rounded-lg p-2 transition-colors"}
          >
            <div className={compact ? "flex items-start gap-2" : "flex items-start gap-3"}>
              {/* Aktivite ikonu */}
              <div className={compact ? "flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[11px]" : "flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm"}>
                {getActivityIcon(activity)}
              </div>
              
              {/* Aktivite içeriği */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={compact ? "text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2" : "text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2"}>
                      {formatActivityMessage(activity)}
                    </p>
                    
                    {/* Proje ve görev bilgileri */}
                    <div className={compact ? "flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground" : "flex items-center gap-2 mt-1 text-xs text-muted-foreground"}>
                      {activity.project_title && (
                        <div className="flex items-center gap-1">
                          <Folder className={compact ? "h-3 w-3" : "h-3 w-3"} />
                          <span className={compact ? "truncate max-w-[110px]" : "truncate max-w-[120px]"}>
                            {activity.project_title}
                          </span>
                        </div>
                      )}
                      {activity.task_title && activity.project_title && (
                        <span>•</span>
                      )}
                      {activity.task_title && (
                        <div className="flex items-center gap-1">
                          <CheckSquare className={compact ? "h-3 w-3" : "h-3 w-3"} />
                          <span className={compact ? "truncate max-w-[110px]" : "truncate max-w-[120px]"}>
                            {activity.task_title}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Zaman ve badge */}
                  <div className={compact ? "flex flex-col items-end gap-0.5" : "flex flex-col items-end gap-1"}>
                    <span className={compact ? "text-[11px] text-muted-foreground whitespace-nowrap" : "text-xs text-muted-foreground whitespace-nowrap"}>
                      {formatTimeAgo(activity.created_at)}
                    </span>
                    <Badge 
                      variant={getActivityBadgeVariant(activity)}
                      className={compact ? "text-[10px] px-1.5 py-0.5" : "text-xs"}
                    >
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                
                {/* Kullanıcı bilgisi */}
                <div className={compact ? "flex items-center gap-1 mt-1 text-[11px] text-muted-foreground" : "flex items-center gap-1 mt-2 text-xs text-muted-foreground"}>
                  <User className={compact ? "h-3 w-3" : "h-3 w-3"} />
                  <span>
                    {activity.user_name || activity.user_email?.split('@')[0] || 'Bilinmeyen Kullanıcı'}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        
        {/* footer kaldırıldı */}
      </CardContent>
    </Card>
  );
}
