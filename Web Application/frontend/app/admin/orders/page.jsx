"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MdShoppingCart } from "react-icons/md";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8800";

const statusBadgeClasses = (status) => {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "confirmed":
    case "ready_for_pickup":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "out_for_delivery":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "delivered":
    case "picked_up":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "cancelled":
      return "bg-rose-50 text-rose-700 border-rose-100";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const paymentStatusBadgeClasses = (status) => {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "failed":
      return "bg-rose-100 text-rose-700";
    case "refunded":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [fulfillmentStatusFilter, setFulfillmentStatusFilter] = useState("all");
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState("all");

  useEffect(() => {
    const fetchOrders = async () => {
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

        const res = await fetch(`${API_URL}/api/orders/admin/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to load orders");
        }

        setOrders(data.orders || []);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Client-side filtering
  const normalizedSearch = search.trim().toLowerCase();
  const filteredOrders = orders.filter((o) => {
    // Search filter
    const matchesSearch = !normalizedSearch || (() => {
      const buyerName = `${o.buyer?.firstName || ""} ${o.buyer?.lastName || ""}`.toLowerCase();
      const sellerName = `${o.seller?.firstName || ""} ${o.seller?.lastName || ""}`.toLowerCase();
      const productName = (o.product?.name || "").toLowerCase();
      const orderNumber = (o.orderNumber || "").toLowerCase();

      return (
        buyerName.includes(normalizedSearch) ||
        sellerName.includes(normalizedSearch) ||
        productName.includes(normalizedSearch) ||
        orderNumber.includes(normalizedSearch)
      );
    })();

    // Status filters
    const matchesPaymentStatus =
      paymentStatusFilter === "all" || o.paymentStatus === paymentStatusFilter;
    const matchesFulfillmentStatus =
      fulfillmentStatusFilter === "all" || o.fulfillmentStatus === fulfillmentStatusFilter;
    const matchesDeliveryType =
      deliveryTypeFilter === "all" || o.deliveryType === deliveryTypeFilter;

    return matchesSearch && matchesPaymentStatus && matchesFulfillmentStatus && matchesDeliveryType;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-slate-600" />
          <p className="text-slate-600 text-sm font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-lg shadow-sm">
        <p className="font-semibold text-sm">Failed to load orders</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage all orders across the platform
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Search orders
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number, buyer, seller, or product..."
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Status
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fulfillment Status
            </label>
            <select
              value={fulfillmentStatusFilter}
              onChange={(e) => setFulfillmentStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="picked_up">Picked Up</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Delivery Type
            </label>
            <select
              value={deliveryTypeFilter}
              onChange={(e) => setDeliveryTypeFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="all">All</option>
              <option value="pickup">Pickup</option>
              <option value="deliver">Delivery</option>
            </select>
          </div>
        </div>
      </div>

      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 sm:px-6 border-b border-slate-200 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              Orders ({filteredOrders.length}
              {filteredOrders.length !== orders.length && search.trim()
                ? ` of ${orders.length} matching "${search.trim()}"`
                : ""}
              )
            </p>
          </div>
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">
                No orders match the current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Buyer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Seller
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Fulfillment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((o) => (
                    <tr
                      key={o._id}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${o._id}`}
                          className="text-slate-900 font-medium underline-offset-2 hover:underline"
                        >
                          {o.orderNumber || "N/A"}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${o._id}`}
                          className="flex items-center gap-2"
                        >
                          <div className="relative w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {o.product?.imageUrl ? (
                              <img
                                src={`${API_URL}/${o.product.imageUrl}`}
                                alt={o.product?.name || "Product"}
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
                                display: o.product?.imageUrl ? "none" : "flex",
                              }}
                            >
                              <MdShoppingCart size={16} />
                            </div>
                          </div>
                          <span className="text-slate-900 underline-offset-2 hover:underline line-clamp-1">
                            {o.product?.name || "Product"}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {o.buyer ? (
                          <Link
                            href={`/admin/users/${o.buyer._id}`}
                            className="text-slate-900 font-medium underline-offset-2 hover:underline"
                          >
                            {o.buyer.firstName} {o.buyer.lastName}
                          </Link>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {o.seller ? (
                          <Link
                            href={`/admin/users/${o.seller._id}`}
                            className="text-slate-900 font-medium underline-offset-2 hover:underline"
                          >
                            {o.seller.firstName} {o.seller.lastName}
                          </Link>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        ${o.amount?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${paymentStatusBadgeClasses(
                            o.paymentStatus
                          )}`}
                        >
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadgeClasses(
                            o.fulfillmentStatus
                          )}`}
                        >
                          {o.fulfillmentStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleDateString()
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

