"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { deleteProduct } from "@/libs/utlis";
import { MdEdit, MdDelete } from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8800";

const DELIVERY_STATUS_PREVIEW = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Accepted" },
  { key: "out_for_delivery", label: "On the way" },
  { key: "delivered", label: "Delivered" },
];

const PICKUP_STATUS_PREVIEW = [
  { key: "pending", label: "Pending" },
  { key: "ready_for_pickup", label: "Ready for pickup" },
  { key: "picked_up", label: "Picked up" },
];

export default function ProductDetailsPage() {
  const { pid } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Check if current user is the seller
  const isSeller = useMemo(() => {
    if (!product || !user) return false;
    return (
      product.createdBy?._id === user._id ||
      product.createdBy === user._id
    );
  }, [product, user]);

  // Check if product is inactive (sold out) - sellers cannot edit/delete inactive products
  const isInactive = product?.status === "inactive";

  const handleEdit = () => {
    router.push(`/sell?edit=${product._id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      setProduct(null); // Clear product state immediately to prevent refetch
      await deleteProduct(product._id);
      router.push("/sell");
    } catch (err) {
      alert(err.message || "Failed to delete product");
      setDeleting(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!pid || deleting) return; // Don't fetch if deleting
      try {
        setLoading(true);
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(`${API_URL}/api/products/${pid}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          // If 404, the product was deleted - redirect to sell page
          if (res.status === 404) {
            router.push("/sell");
            return;
          }
          throw new Error("Failed to load product.");
        }

        const data = await res.json();
        setProduct(data.product || data);
      } catch (err) {
        setError(err.message || "Unable to load product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [pid, deleting]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Product Details
              </p>
              <h1 className="text-3xl font-semibold text-slate-900 mt-1">
                {product?.name || "Loading"}
              </h1>
            </div>
            <Link
              href="/buy"
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100"
            >
              Back to Browse
            </Link>
          </div>

          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-600" />
                <p className="text-gray-600 font-medium">Loading product...</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
              <p className="font-semibold text-lg mb-1">Unable to load product</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && product && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-100 rounded-xl h-80 flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={`${API_URL}/${product.imageUrl}`}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-slate-400 text-sm">No image available</div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase text-slate-500 tracking-wide">
                    Price
                  </p>
                  <p className="text-4xl font-semibold text-slate-900 mt-1">
                    ${Number(product.price || 0).toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                  <div>
                    <p className="font-medium text-slate-500 uppercase tracking-wide text-xs mb-1">
                      Category
                    </p>
                    <p className="text-slate-900">{product.category}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-500 uppercase tracking-wide text-xs mb-1">
                      Condition
                    </p>
                    <p className="text-slate-900">{product.condition}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-500 uppercase tracking-wide text-xs mb-1">
                      Quantity
                    </p>
                    <p className="text-slate-900">{product.quantity}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-500 uppercase tracking-wide text-xs mb-1">
                      Status
                    </p>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        product.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : product.status === "inactive"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-slate-500 uppercase tracking-wide text-xs mb-2">
                    Description
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    {product.description || "No description provided."}
                  </p>
                </div>

                {product.createdBy && (
                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <p className="font-medium text-slate-500 uppercase tracking-wide text-xs mb-2">
                      Seller
                    </p>
                    <p className="text-slate-900 font-semibold">
                      {product.createdBy.firstName} {product.createdBy.lastName}
                    </p>
                    <p className="text-slate-600 text-sm">
                      {product.createdBy.email}
                    </p>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-4 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900 mb-2">
                      Delivery status overview
                    </p>
                    <div className="flex flex-wrap gap-2 text-slate-600">
                      {DELIVERY_STATUS_PREVIEW.map((step, idx) => (
                        <span
                          key={step.key}
                          className="px-3 py-1 rounded-full bg-white border border-slate-200"
                        >
                          {idx + 1}. {step.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-2">
                      Pickup status overview
                    </p>
                    <div className="flex flex-wrap gap-2 text-slate-600">
                      {PICKUP_STATUS_PREVIEW.map((step, idx) => (
                        <span
                          key={step.key}
                          className="px-3 py-1 rounded-full bg-white border border-slate-200"
                        >
                          {idx + 1}. {step.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {isSeller && !isInactive ? (
                  <div className="flex gap-4">
                    <button
                      onClick={handleEdit}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      <MdEdit size={20} />
                      Edit Product
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MdDelete size={20} />
                      {deleting ? "Deleting..." : "Delete Product"}
                    </button>
                  </div>
                ) : isSeller && isInactive ? (
                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <p className="text-sm text-slate-600 text-center">
                      This product is sold out and cannot be edited or deleted.
                    </p>
                  </div>
                ) : (
                  <Link
                    href={`/checkout?product=${product._id}`}
                    className="w-full px-6 py-3 bg-slate-900 hover:bg-slate-700 text-white rounded-lg font-semibold text-center transition-colors block"
                  >
                    Buy Now
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}