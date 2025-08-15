import TaskCalendar from '@/features/tasks/components/TaskCalendar'

export const dynamic = 'force-dynamic'

export default function CalendarPage() {
  return (
    <div className="container mx-auto p-4">
      <TaskCalendar />
    </div>
  )
}


