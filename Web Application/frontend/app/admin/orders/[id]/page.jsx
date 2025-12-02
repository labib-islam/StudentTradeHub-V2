"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MdShoppingCart, MdArrowBack } from "react-icons/md";

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

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [fulfillmentStatus, setFulfillmentStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
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

        const res = await fetch(`${API_URL}/api/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to load order");
        }

        setOrder(data.order);
        setPaymentStatus(data.order.paymentStatus);
        setFulfillmentStatus(data.order.fulfillmentStatus);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!order) return;

    const hasChanges =
      paymentStatus !== order.paymentStatus ||
      fulfillmentStatus !== order.fulfillmentStatus;

    if (!hasChanges) return;

    try {
      setUpdating(true);
      setUpdateError(null);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;

      if (!token) {
        throw new Error("Authentication required");
      }

      const res = await fetch(`${API_URL}/api/orders/${id}/status/admin`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentStatus: paymentStatus !== order.paymentStatus ? paymentStatus : undefined,
          fulfillmentStatus: fulfillmentStatus !== order.fulfillmentStatus ? fulfillmentStatus : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update order status");
      }

      // Update local state
      setOrder({
        ...order,
        paymentStatus: data.order.paymentStatus,
        fulfillmentStatus: data.order.fulfillmentStatus,
      });
    } catch (err) {
      console.error("Error updating order status:", err);
      setUpdateError(err.message || "Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-slate-600" />
          <p className="text-slate-600 text-sm font-medium">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-lg shadow-sm">
        <p className="font-semibold text-sm">Failed to load order</p>
        <p className="text-xs mt-1">{error || "Order not found."}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            aria-label="Go back"
          >
            <MdArrowBack size={20} className="text-slate-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Order {order.orderNumber || "Details"}
            </h1>
            <p className="text-sm text-slate-600 mt-1">Order Management</p>
          </div>
        </div>
      </div>

      {updateError && (
        <div className="mb-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-lg shadow-sm">
          <p className="font-semibold text-sm">Failed to update status</p>
          <p className="text-xs mt-1">{updateError}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Product Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Product Information
          </h2>
          <div className="flex gap-4">
            <div className="relative w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {order.product?.imageUrl && !imageError ? (
                <img
                  src={`${API_URL}/${order.product.imageUrl}`}
                  alt={order.product?.name || "Product"}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full text-slate-400">
                  <MdShoppingCart size={32} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 mb-1">
                {order.product?.name || "Product"}
              </h3>
              <p className="text-sm text-slate-600 mb-2">
                Quantity: {order.quantity}
              </p>
              <p className="text-lg font-semibold text-slate-900">
                ${order.amount?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Order Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Order Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order Number
              </label>
              <p className="text-sm text-slate-900">
                {order.orderNumber || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Delivery Type
              </label>
              <p className="text-sm text-slate-900 capitalize">
                {order.deliveryType}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Created
              </label>
              <p className="text-sm text-slate-900">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString()
                  : "-"}
              </p>
            </div>
            {order.notes && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <p className="text-sm text-slate-900">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        {/* Buyer Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Buyer
          </h2>
          {order.buyer ? (
            <div className="space-y-2">
              <Link
                href={`/admin/users/${order.buyer._id}`}
                className="text-slate-900 font-semibold hover:underline underline-offset-2 block"
              >
                {order.buyer.firstName} {order.buyer.lastName}
              </Link>
              <p className="text-sm text-slate-600">{order.buyer.email}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Buyer information not available</p>
          )}
        </div>

        {/* Seller Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Seller
          </h2>
          {order.seller ? (
            <div className="space-y-2">
              <Link
                href={`/admin/users/${order.seller._id}`}
                className="text-slate-900 font-semibold hover:underline underline-offset-2 block"
              >
                {order.seller.firstName} {order.seller.lastName}
              </Link>
              <p className="text-sm text-slate-600">{order.seller.email}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Seller information not available</p>
          )}
        </div>
      </div>

      {/* Status Management */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Status Management
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Payment Status
            </label>
            <div className="flex items-center gap-3">
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                disabled={updating}
                className="flex-1 px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${paymentStatusBadgeClasses(
                  paymentStatus
                )}`}
              >
                {paymentStatus}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Fulfillment Status
            </label>
            <div className="flex items-center gap-3">
              <select
                value={fulfillmentStatus}
                onChange={(e) => setFulfillmentStatus(e.target.value)}
                disabled={updating}
                className="flex-1 px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="ready_for_pickup">Ready for Pickup</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="picked_up">Picked Up</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadgeClasses(
                  fulfillmentStatus
                )}`}
              >
                {fulfillmentStatus.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleStatusUpdate}
            disabled={
              updating ||
              (paymentStatus === order.paymentStatus &&
                fulfillmentStatus === order.fulfillmentStatus)
            }
            className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? "Updating..." : "Update Status"}
          </button>
          {(paymentStatus !== order.paymentStatus ||
            fulfillmentStatus !== order.fulfillmentStatus) && (
            <p className="text-xs text-slate-500">
              Changes will be saved when you click "Update Status"
            </p>
          )}
        </div>
      </div>
    </>
  );
}

