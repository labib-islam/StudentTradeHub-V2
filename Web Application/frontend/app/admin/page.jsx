"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-slate-600">
            Welcome{" "}
            <span className="font-semibold">
              {user?.firstName} {user?.lastName}
            </span>
            . Manage the platform, users, products, and orders from here.
          </p>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
        <Link
          href="/admin/users"
          className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              User Management
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              View and manage all registered users. Suspend accounts, inspect
              activity, and handle support requests.
            </p>
          </div>
          <span className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">
            Go to users &rarr;
          </span>
        </Link>

        <Link
          href="/admin/products"
          className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Product Management
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Browse all listings, moderate inappropriate items, and manage
              product visibility across the marketplace.
            </p>
          </div>
          <span className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">
            Go to products &rarr;
          </span>
        </Link>

        <Link
          href="/admin/orders"
          className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Orders & Activity
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Monitor orders across the platform and review transaction history
              to keep everything running smoothly.
            </p>
          </div>
          <span className="text-sm font-semibold text-slate-900 group-hover:text-slate-700">
            Go to orders &rarr;
          </span>
        </Link>
      </div>

      {/* Placeholder for future analytics */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          Platform overview
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          This section will show key metrics like total users, active listings,
          recent reports, and order volume once we wire up the admin APIs.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-slate-400 text-sm">
            Users metric coming soon
          </div>
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-slate-400 text-sm">
            Listings metric coming soon
          </div>
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-slate-400 text-sm">
            Orders metric coming soon
          </div>
        </div>
      </div>
    </>
  );
}
