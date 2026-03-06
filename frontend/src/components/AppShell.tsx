import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <Sidebar />
      <div className="flex flex-col min-h-screen bg-zinc-950">
        <Topbar />
        <main className="flex-1 p-5 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
