import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/app/admin/AdminSidebar";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  // isDemo is true when authenticated via the demo passcode (id = "demo-owner-id"),
  // not via a real Supabase account. This controls the Demo badge in the sidebar.
  const isDemo = admin.id === "demo-owner-id";

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col md:flex-row font-sans selection:bg-[#1E88E5]/20">
      <AdminSidebar
        user={{ name: admin.name, email: admin.email, role: admin.role, isDemo }}
      />
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}
