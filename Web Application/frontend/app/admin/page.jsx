"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8800";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;

        if (!token) return;

        const res = await fetch(`${API_URL}/api/orders/admin/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setStats(data);
        }
      } catch (err) {
        console.error("Error fetching order statistics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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

      {/* Order Statistics */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Order Statistics
        </h2>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-slate-600" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Total Orders
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {stats.totalOrders || 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-slate-900">
                ${(stats.totalRevenue || 0).toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Pending Orders
              </p>
              <p className="text-2xl font-bold text-amber-600">
                {stats.pendingOrders || 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Completed Orders
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                {stats.completedOrders || 0}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Failed to load statistics</p>
        )}
      </div>
    </>
  );
}
