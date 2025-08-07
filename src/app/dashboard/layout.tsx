import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl gap-6 p-4">
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}


