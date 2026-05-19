"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MdShoppingCart, MdArrowBack } from "react-icons/md";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8800";

export default function AdminProductDetailPage() {
  const { pid } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!pid) return;
    const fetchProduct = async () => {
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

        const res = await fetch(`${API_URL}/api/products/${pid}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to load product");
        }

        setProduct(data.product);
        setStatus(data.product.status);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [pid]);

  const handleStatusUpdate = async () => {
    if (!product || status === product.status) return;

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

      const res = await fetch(`${API_URL}/api/products/${pid}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update product status");
      }

      // Update local state
      setProduct({ ...product, status });
    } catch (err) {
      console.error("Error updating product status:", err);
      setUpdateError(err.message || "Failed to update product status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-slate-600" />
          <p className="text-slate-600 text-sm font-medium">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-lg shadow-sm">
        <p className="font-semibold text-sm">Failed to load product</p>
        <p className="text-xs mt-1">{error || "Product not found."}</p>
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
            <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
            <p className="text-sm text-slate-600 mt-1">Product Management</p>
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
        {/* Product Image */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Product Image
          </h2>
          <div className="relative w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
            {product.imageUrl && !imageError ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full text-slate-400">
                <MdShoppingCart size={64} />
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Product Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  product.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : product.status === "draft"
                    ? "bg-slate-100 text-slate-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {product.status}
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Name
              </label>
              <p className="text-sm text-slate-900">{product.name}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <p className="text-sm text-slate-900">
                {product.description || "No description"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <p className="text-sm text-slate-900">{product.category}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Condition
                </label>
                <p className="text-sm text-slate-900">{product.condition}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Price
                </label>
                <p className="text-sm text-slate-900">
                  ${product.price?.toFixed(2)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity
                </label>
                <p className="text-sm text-slate-900">{product.quantity}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Owner
              </label>
              {product.createdBy ? (
                <Link
                  href={`/admin/users/${product.createdBy._id}`}
                  className="text-sm text-slate-900 font-medium underline-offset-2 hover:underline"
                >
                  {product.createdBy.firstName} {product.createdBy.lastName}
                </Link>
              ) : (
                <p className="text-sm text-slate-500">-</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Created
              </label>
              <p className="text-sm text-slate-900">
                {product.createdAt
                  ? new Date(product.createdAt).toLocaleString()
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Management */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Status Management
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={updating}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <button
            onClick={handleStatusUpdate}
            disabled={updating || status === product.status}
            className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? "Updating..." : "Update Status"}
          </button>
        </div>
        {status !== product.status && (
          <p className="text-xs text-slate-500 mt-2">
            Status will be changed from{" "}
            <span className="font-semibold">{product.status}</span> to{" "}
            <span className="font-semibold">{status}</span>
          </p>
        )}
      </div>
    </>
  );
}

