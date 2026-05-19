"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import UserRoute from "@/components/UserRoute";
import { fetchOrders } from "@/libs/utlis";
import { useSearch } from "@/context/SearchContext";

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

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

export default function OrdersPage() {
  const { searchTerm, selectedStatus, setSearchTerm, setSelectedStatus } = useSearch();
  const [activeTab, setActiveTab] = useState("buyer");
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [buyer, seller] = await Promise.all([
          fetchOrders("buyer"),
          fetchOrders("seller"),
        ]);
        setBuyerOrders(buyer);
        setSellerOrders(seller);
      } catch (err) {
        setError(err.message || "Failed to load your orders.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter orders based on search and status
  const ordersToShow = useMemo(() => {
    const allOrders = activeTab === "buyer" ? buyerOrders : sellerOrders;
    
    return allOrders.filter((order) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const productName = order.product?.name?.toLowerCase() || "";
        if (!productName.includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== "all" && order.fulfillmentStatus !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [activeTab, buyerOrders, sellerOrders, searchTerm, selectedStatus]);

  return (
    <UserRoute>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Orders
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 mt-1">
              Your orders
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl">
              View items you&apos;ve purchased and orders for items you&apos;ve
              sold.
            </p>
          </header>

          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab("buyer");
                setSearchTerm("");
                setSelectedStatus("all");
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                activeTab === "buyer"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              Buying ({buyerOrders.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("seller");
                setSearchTerm("");
                setSelectedStatus("all");
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                activeTab === "seller"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              Selling ({sellerOrders.length})
            </button>
          </div>

          {/* Results Count */}
          {!loading && !error && (buyerOrders.length > 0 || sellerOrders.length > 0) && (
            <div className="mb-6 flex justify-end">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                Showing {ordersToShow.length} of {activeTab === "buyer" ? buyerOrders.length : sellerOrders.length} orders
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-600" />
                <p className="text-gray-600 font-medium">
                  Loading your orders...
                </p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
              <p className="font-semibold text-lg mb-1">Unable to load orders</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {ordersToShow.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                  {activeTab === "buyer" && buyerOrders.length === 0 ? (
                    <>
                      <h2 className="text-lg font-semibold text-slate-900 mb-2">
                        No orders yet
                      </h2>
                      <p className="text-sm text-slate-600 mb-4">
                        You haven't purchased anything yet. Browse items from your classmates.
                      </p>
                      <Link
                        href="/buy"
                        className="inline-block px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700"
                      >
                        Browse items
                      </Link>
                    </>
                  ) : activeTab === "seller" && sellerOrders.length === 0 ? (
                    <>
                      <h2 className="text-lg font-semibold text-slate-900 mb-2">
                        No orders yet
                      </h2>
                      <p className="text-sm text-slate-600 mb-4">
                        No one has purchased your items yet. List a product to start selling.
                      </p>
                      <Link
                        href="/sell"
                        className="inline-block px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700"
                      >
                        List an item
                      </Link>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold text-slate-900 mb-2">
                        No orders match your filters
                      </h2>
                      <p className="text-sm text-slate-600 mb-4">
                        Try adjusting your search or filters to find what you're looking for.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedStatus("all");
                        }}
                        className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700"
                      >
                        Clear Filters
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  {/* Table Header - Hidden on mobile */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="col-span-4">Product</div>
                    <div className="col-span-2">{activeTab === "buyer" ? "Seller" : "Buyer"}</div>
                    <div className="col-span-1 text-right">Qty</div>
                    <div className="col-span-1 text-right">Amount</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2 text-right">Date</div>
                  </div>
                  
                  {/* Table Rows */}
                  <div className="divide-y divide-slate-200">
                    {ordersToShow.map((order) => {
                      const product = order.product || {};
                      const counterpart =
                        activeTab === "buyer" ? order.seller : order.buyer;

                      return (
                        <Link
                          key={order._id}
                          href={`/orders/${order._id}`}
                          className="block md:grid md:grid-cols-12 gap-4 px-4 md:px-6 py-4 hover:bg-slate-50 transition-colors"
                        >
                          {/* Product - Mobile: Full width, Desktop: 4 columns */}
                          <div className="col-span-12 md:col-span-4 flex items-center gap-3 mb-3 md:mb-0">
                            <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-slate-400 text-xs">
                                  No image
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 line-clamp-2">
                                {product.name || "Product"}
                              </p>
                              {/* Show counterpart on mobile only */}
                              <p className="text-xs text-slate-500 mt-1 md:hidden">
                                {activeTab === "buyer" ? "From" : "To"}{" "}
                                {counterpart
                                  ? `${counterpart.firstName} ${counterpart.lastName}`
                                  : "Unknown"}
                              </p>
                            </div>
                          </div>

                          {/* Counterpart - Hidden on mobile, Desktop: 2 columns */}
                          <div className="hidden md:flex md:col-span-2 items-center">
                            <p className="text-sm text-slate-700">
                              {counterpart
                                ? `${counterpart.firstName} ${counterpart.lastName}`
                                : "Unknown"}
                            </p>
                          </div>

                          {/* Quantity - Hidden on mobile, Desktop: 1 column */}
                          <div className="hidden md:flex md:col-span-1 items-center justify-end">
                            <span className="text-sm text-slate-700">
                              {order.quantity || 1}
                            </span>
                          </div>

                          {/* Amount - Mobile: Inline with status, Desktop: 1 column */}
                          <div className="col-span-12 md:col-span-1 flex md:justify-end items-center mb-2 md:mb-0">
                            <span className="text-sm font-semibold text-slate-900">
                              ${Number(order.amount || 0).toFixed(2)}
                            </span>
                            {/* Show quantity on mobile */}
                            <span className="text-xs text-slate-500 ml-2 md:hidden">
                              (Qty: {order.quantity || 1})
                            </span>
                          </div>

                          {/* Status - Mobile: Full width, Desktop: 2 columns */}
                          <div className="col-span-12 md:col-span-2 flex items-center mb-2 md:mb-0">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeClasses(
                                order.fulfillmentStatus
                              )}`}
                            >
                              {order.fulfillmentStatus.replace(/_/g, " ")}
                            </span>
                          </div>

                          {/* Date - Mobile: Full width, Desktop: 2 columns */}
                          <div className="col-span-12 md:col-span-2 flex md:justify-end items-center">
                            <span className="text-xs text-slate-500">
                              {formatDate(order.createdAt)}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </UserRoute>
  );
}


