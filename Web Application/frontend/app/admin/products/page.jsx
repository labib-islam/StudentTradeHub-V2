"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MdShoppingCart } from "react-icons/md";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8800";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;

        if (!token) {
          throw new Error("Authentication required");
        }

        const res = await fetch(`${API_URL}/api/products`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to load products");
        }

        setProducts(data.products || []);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredProducts = products.filter((p) => {
    const name = (p.name ?? "").toLowerCase();
    const ownerName = p.createdBy
      ? `${p.createdBy.firstName ?? ""} ${p.createdBy.lastName ?? ""}`.toLowerCase()
      : "";
    const status = (p.status ?? "active").toLowerCase();

    const matchesSearch =
      !normalizedSearch ||
      name.includes(normalizedSearch) ||
      ownerName.includes(normalizedSearch);
    const matchesStatus =
      statusFilter === "all" || status === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-slate-600" />
          <p className="text-slate-600 text-sm font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-lg shadow-sm">
        <p className="font-semibold text-sm">Failed to load products</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage all products in the marketplace
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Search products
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or owner..."
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 sm:px-6 border-b border-slate-200 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              Products ({filteredProducts.length}
              {filteredProducts.length !== products.length && search.trim()
                ? ` of ${products.length} matching "${search.trim()}"`
                : ""}
              )
            </p>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">
                No products match the current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => (
                    <tr
                      key={p._id}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/products/${p._id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="relative w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {p.imageUrl ? (
                              <img
                                src={`${API_URL}/${p.imageUrl}`}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className="flex items-center justify-center h-full w-full text-slate-400"
                              style={{
                                display: p.imageUrl ? "none" : "flex",
                              }}
                            >
                              <MdShoppingCart size={20} />
                            </div>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-slate-900 underline-offset-2 hover:underline line-clamp-1">
                              {p.name}
                            </span>
                            <span className="text-xs text-slate-500 line-clamp-1">
                              View details
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        ${p.price?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{p.quantity}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            p.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : p.status === "draft"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.createdBy ? (
                          <Link
                            href={`/admin/users/${p.createdBy._id}`}
                            className="text-slate-900 font-medium underline-offset-2 hover:underline"
                          >
                            {p.createdBy.firstName} {p.createdBy.lastName}
                          </Link>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}

