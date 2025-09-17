"use client";

import * as React from 'react'
import DashboardHeader from '@/components/layout/DashboardHeader'
import SprintPlanner from '@/features/tasks/components/SprintPlanner'

export default function TasksSprintsPage() {
  return (
    <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      <DashboardHeader title="Sprint Planlama" backHref="/dashboard/tasks" breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Görevler', href: '/dashboard/tasks' }, { label: 'Sprints' }]} />
      <div className="mt-6">
        <SprintPlanner />
      </div>
    </div>
  )
}


