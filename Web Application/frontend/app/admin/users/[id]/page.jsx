 "use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MdShoppingCart } from "react-icons/md";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8800";

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("products"); // "products" | "orders"
  const [orderRole, setOrderRole] = useState("buyer"); // "buyer" | "seller"
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
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

        const [userRes, activityRes] = await Promise.all([
          fetch(`${API_URL}/api/users/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/api/users/${id}/activity`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const userData = await userRes.json();
        const activityData = await activityRes.json();

        if (!userRes.ok) {
          throw new Error(userData.message || "Failed to load user");
        }
        if (!activityRes.ok) {
          throw new Error(
            activityData.message || "Failed to load user activity"
          );
        }

        setUser(userData);
        setActivity(activityData);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(err.message || "Failed to load user");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    // Fetch orders when switching to orders tab or changing buyer/seller
    const fetchOrders = async () => {
      if (!id || tab !== "orders") return;

      try {
        setOrdersLoading(true);
        setOrdersError(null);

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;

        if (!token) {
          throw new Error("Authentication required");
        }

        const res = await fetch(
          `${API_URL}/api/orders/admin/user/${id}?role=${orderRole}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to load orders");
        }

        setOrders(data.orders || []);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setOrdersError(err.message || "Failed to load orders");
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [id, tab, orderRole]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-slate-600" />
          <p className="text-slate-600 text-sm font-medium">
            Loading user...
          </p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-lg shadow-sm">
        <p className="font-semibold text-sm">Failed to load user</p>
        <p className="text-xs mt-1">{error || "User not found."}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {user.firstName} {user.lastName}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{user.email}</p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                user.status === "blocked"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {user.status === "blocked" ? "Blocked" : "Active"}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 capitalize">
              {user.role || "user"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {user.status === "blocked" ? (
            <button
              type="button"
              onClick={async () => {
                try {
                  const token =
                    typeof window !== "undefined"
                      ? localStorage.getItem("token")
                      : null;
                  if (!token) return;

                  const res = await fetch(
                    `${API_URL}/api/users/${id}/status`,
                    {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ status: "active" }),
                    }
                  );
                  const data = await res.json();
                  if (res.ok) {
                    setUser((prev) => ({ ...prev, status: "active" }));
                  } else {
                    console.error("Failed to update status", data);
                  }
                } catch (err) {
                  console.error("Failed to update status", err);
                }
              }}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Unblock user
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                try {
                  const token =
                    typeof window !== "undefined"
                      ? localStorage.getItem("token")
                      : null;
                  if (!token) return;

                  const res = await fetch(
                    `${API_URL}/api/users/${id}/status`,
                    {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ status: "blocked" }),
                    }
                  );
                  const data = await res.json();
                  if (res.ok) {
                    setUser((prev) => ({ ...prev, status: "blocked" }));
                  } else {
                    console.error("Failed to update status", data);
                  }
                } catch (err) {
                  console.error("Failed to update status", err);
                }
              }}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
            >
              Block user
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Account details
          </h2>
          <dl className="space-y-2 text-sm text-slate-700">
            <div className="flex justify-between">
              <dt className="text-slate-500">Role</dt>
              <dd className="font-medium capitalize">
                {user.role || "user"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Joined</dt>
              <dd className="font-medium">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "-"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Activity overview
          </h2>
          {activity ? (
            <dl className="space-y-2 text-sm text-slate-700">
              <div className="flex justify-between">
                <dt className="text-slate-500">Products listed</dt>
                <dd className="font-medium">
                  {activity.productCount}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Orders bought</dt>
                <dd className="font-medium">
                  {activity.boughtCount}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Orders sold</dt>
                <dd className="font-medium">
                  {activity.soldCount}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-slate-600">
              No activity data available.
            </p>
          )}
        </div>
      </div>

      {/* Products / Orders section */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setTab("products")}
              className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md ${
                tab === "products"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Products
            </button>
            <button
              type="button"
              onClick={() => setTab("orders")}
              className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md ${
                tab === "orders"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Orders
            </button>
          </div>

          {tab === "orders" && (
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setOrderRole("buyer")}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md ${
                  orderRole === "buyer"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Buying
              </button>
              <button
                type="button"
                onClick={() => setOrderRole("seller")}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md ${
                  orderRole === "seller"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Selling
              </button>
            </div>
          )}
        </div>

        {tab === "products" ? (
          <ProductsPanel
            user={user}
            search={productSearch}
            setSearch={setProductSearch}
            statusFilter={productStatusFilter}
            setStatusFilter={setProductStatusFilter}
          />
        ) : (
          <OrdersPanel
            orders={orders}
            loading={ordersLoading}
            error={ordersError}
            role={orderRole}
            search={orderSearch}
            setSearch={setOrderSearch}
            statusFilter={orderStatusFilter}
            setStatusFilter={setOrderStatusFilter}
          />
        )}
      </div>
    </>
  );
}

function ProductCard({ product: p }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
      {/* Product Image */}
      <div className="relative h-40 bg-slate-100 flex items-center justify-center overflow-hidden">
        {p.imageUrl && !imageError ? (
          <img
            src={`${API_URL}/${p.imageUrl}`}
            alt={p.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full text-slate-400">
            <MdShoppingCart size={48} />
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-900 line-clamp-1 flex-1">
            {p.name}
          </h3>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 ${
              p.status === "active"
                ? "bg-emerald-100 text-emerald-700"
                : p.status === "draft"
                ? "bg-slate-100 text-slate-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {p.status}
          </span>
        </div>
        <p className="text-xs text-slate-500 line-clamp-2">
          {p.description || "No description"}
        </p>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="font-semibold text-slate-900">
            ${p.price?.toFixed(2)}
          </span>
          <span className="text-slate-500 text-xs">
            {p.quantity} in stock
          </span>
        </div>
      </div>
    </div>
  );
}

function ProductsPanel({
  user,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
}) {
  const products = user?.productList || [];
  const normalizedSearch = search.trim().toLowerCase();

  const filtered = products.filter((p) => {
    const name = (p.name ?? "").toLowerCase();
    const category = (p.category ?? "").toLowerCase();
    const status = (p.status ?? "active").toLowerCase();

    const matchesSearch =
      !normalizedSearch ||
      name.includes(normalizedSearch) ||
      category.includes(normalizedSearch);
    const matchesStatus =
      statusFilter === "all" || status === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Search products
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or category..."
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

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">
          No products match the current filters.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </>
  );
}

function OrderCard({ order: o }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {o.product?.imageUrl && !imageError ? (
            <img
              src={`${API_URL}/${o.product.imageUrl}`}
              alt={o.product?.name || "Product"}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full text-slate-400">
              <MdShoppingCart size={32} />
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500">
                {o.orderNumber || "Order"}
              </p>
              <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                {o.product?.name || "Product"}
              </p>
            </div>
            <span className="text-sm font-semibold text-slate-900 flex-shrink-0">
              ${o.amount?.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>
              Qty: {o.quantity} •{" "}
              {new Date(o.createdAt).toLocaleDateString()}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                o.fulfillmentStatus === "cancelled"
                  ? "bg-rose-100 text-rose-700"
                  : o.fulfillmentStatus === "delivered" ||
                    o.fulfillmentStatus === "picked_up"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {o.fulfillmentStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrdersPanel({
  orders,
  loading,
  error,
  role,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
}) {
  const normalizedSearch = search.trim().toLowerCase();

  const filtered = (orders || []).filter((o) => {
    const productName = (o.product?.name ?? "").toLowerCase();
    const orderNumber = (o.orderNumber ?? "").toLowerCase();
    const status = (o.fulfillmentStatus ?? "").toLowerCase();

    const matchesSearch =
      !normalizedSearch ||
      productName.includes(normalizedSearch) ||
      orderNumber.includes(normalizedSearch);

    const matchesStatus =
      statusFilter === "all" || status === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Search orders
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product or order number..."
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
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="ready_for_pickup">Ready for pickup</option>
            <option value="out_for_delivery">Out for delivery</option>
            <option value="delivered">Delivered</option>
            <option value="picked_up">Picked up</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-slate-600" />
            <p className="text-slate-600 text-xs font-medium">
              Loading {role === "buyer" ? "purchases" : "sales"}...
            </p>
          </div>
        </div>
      ) : error ? (
        <p className="text-sm text-rose-600">
          {error}
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">
          No orders match the current filters.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <OrderCard key={o._id} order={o} />
          ))}
        </div>
      )}
    </>
  );
}
