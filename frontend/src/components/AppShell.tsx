import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] bg-transparent">
      <Sidebar />
      <div className="flex min-h-screen flex-col bg-transparent">
        <Topbar />
        <main className="flex-1 overflow-auto p-5">{children}</main>
      </div>
    </div>
  );
}
