"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminRoute from "@/components/AdminRoute";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({ children }) {
  const { user } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/orders", label: "Orders" },
  ];

  return (
    <AdminRoute>
      <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto flex gap-6">
          {/* Left sidebar */}
          <aside className="hidden md:flex flex-col w-64 bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="mb-6">
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1">
                Admin
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                Control Panel
              </h2>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-6 text-xs text-slate-400">
              Signed in as
              <br />
              <span className="font-medium text-slate-600">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
          </aside>

          {/* Main content */}
          <section className="flex-1">{children}</section>
        </div>
      </main>
    </AdminRoute>
  );
}
