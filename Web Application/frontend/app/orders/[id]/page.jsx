"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import UserRoute from "@/components/UserRoute";
import { useAuth } from "@/context/AuthContext";
import { fetchOrderById, updateOrderStatus, createReview, skipReview, getReviewByOrder } from "@/libs/utlis";
import ReviewModal from "@/components/ReviewModal";

const formatDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPipeline = (deliveryType) =>
  deliveryType === "pickup"
    ? ["pending", "ready_for_pickup", "picked_up"]
    : ["pending", "confirmed", "out_for_delivery", "delivered"];

const statusLabel = (status) =>
  status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const statusClasses = (status) => {
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

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);

  const isSeller = useMemo(() => {
    if (!order || !user) return false;
    return order.seller?._id === user._id;
  }, [order, user]);

  const isBuyer = useMemo(() => {
    if (!order || !user) return false;
    return order.buyer?._id === user._id;
  }, [order, user]);

  const canReview = useMemo(() => {
    if (!order || !isBuyer) return false;
    const isCompleted = order.fulfillmentStatus === "delivered" || order.fulfillmentStatus === "picked_up";
    // Can review if order is completed and not yet reviewed (ignore reviewSkipped for order details page)
    return isCompleted && !order.isReviewed;
  }, [order, isBuyer]);

  const deliveryType = order?.deliveryType || "pickup";
  const pipeline = getPipeline(deliveryType);

  const nextStatuses = useMemo(() => {
    if (!order) return [];
    const currentIndex = pipeline.indexOf(order.fulfillmentStatus);
    if (currentIndex === -1) return [];
    // allow only forward moves; also allow cancellation from pending
    const forward = pipeline.slice(currentIndex + 1);
    const extras =
      order.fulfillmentStatus === "pending" ? ["cancelled"] : [];
    return [...forward, ...extras];
  }, [order, pipeline]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await fetchOrderById(id);
        setOrder(data);
      } catch (err) {
        setError(err.message || "Failed to load order.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Fetch existing review if order is reviewed
  useEffect(() => {
    const loadReview = async () => {
      if (!order || !isBuyer || !order.isReviewed) return;
      try {
        setLoadingReview(true);
        const review = await getReviewByOrder(order._id);
        setExistingReview(review);
      } catch (err) {
        console.error("Failed to load review:", err);
      } finally {
        setLoadingReview(false);
      }
    };
    loadReview();
  }, [order, isBuyer]);

  const handleStatusChange = async (status) => {
    if (!order || !status) return;
    try {
      setUpdating(true);
      setUpdateError(null);
      setUpdateSuccess(null);
      const updated = await updateOrderStatus(order._id, status);
      setOrder(updated);
      setUpdateSuccess("Order status updated.");
    } catch (err) {
      setUpdateError(err.message || "Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitReview = async (orderId, rating, comment) => {
    try {
      await createReview(orderId, rating, comment);
      setShowReviewModal(false);
      // Refresh order to update review status
      const updatedOrder = await fetchOrderById(id);
      setOrder(updatedOrder);
      setUpdateSuccess("Review submitted successfully!");
    } catch (err) {
      setUpdateError(err.message || "Failed to submit review");
    }
  };

  const handleSkipReview = async (orderId) => {
    try {
      await skipReview(orderId);
      setShowReviewModal(false);
      // Refresh order to update review status
      const updatedOrder = await fetchOrderById(id);
      setOrder(updatedOrder);
    } catch (err) {
      console.error("Failed to skip review:", err);
    }
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
  };

  return (
    <UserRoute>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Order
              </p>
              <h1 className="text-3xl font-semibold text-slate-900 mt-1">
                Order details
              </h1>
              {order && (
                <p className="text-xs text-slate-500 mt-1">
                  Placed on {formatDateTime(order.createdAt)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100"
            >
              Back
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-600" />
                <p className="text-gray-600 font-medium">
                  Loading order details...
                </p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
              <p className="font-semibold text-lg mb-1">Unable to load order</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && order && (
            <div className="space-y-6">
              {/* Product + counterpart */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-40 h-40 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {order.product?.imageUrl ? (
                    <img
                      src={order.product.imageUrl}
                      alt={order.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-slate-400 text-xs">No image</span>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {order.product?.name || "Product"}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Amount paid:{" "}
                      <span className="font-semibold text-slate-900">
                        ${Number(order.amount || 0).toFixed(2)}
                      </span>
                    </p>
                    <Link
                      href={`/product/${order.product?._id}`}
                      className="inline-block mt-2 text-xs text-slate-700 underline hover:text-slate-900"
                    >
                      View product page
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Buyer
                      </p>
                      <p className="text-slate-900">
                        {order.buyer?.firstName} {order.buyer?.lastName}
                      </p>
                      <p className="text-slate-600 text-xs">
                        {order.buyer?.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Seller
                      </p>
                      <p className="text-slate-900">
                        {order.seller?.firstName} {order.seller?.lastName}
                      </p>
                      <p className="text-slate-600 text-xs">
                        {order.seller?.email}
                      </p>
                      {order.seller?.sellerRating?.totalReviews > 0 && (
                        <div className="text-xs text-yellow-600 font-medium flex items-center gap-0.5 mt-1">
                          <span>★</span>
                          <span>{order.seller.sellerRating.averageRating.toFixed(1)}</span>
                          <span className="text-slate-500">({order.seller.sellerRating.totalReviews})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Status + timeline */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Fulfillment status
                    </p>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusClasses(
                        order.fulfillmentStatus
                      )}`}
                    >
                      {statusLabel(order.fulfillmentStatus)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Payment:{" "}
                    <span className="font-semibold capitalize">
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Status timeline ({deliveryType === "pickup" ? "Pickup" : "Delivery"})
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {pipeline.map((step) => {
                      const idx = pipeline.indexOf(step);
                      const currentIdx = pipeline.indexOf(
                        order.fulfillmentStatus
                      );
                      const completed = currentIdx > idx;
                      const current = currentIdx === idx;
                      return (
                        <span
                          key={step}
                          className={`px-3 py-1 rounded-full border ${completed
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : current
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                            }`}
                        >
                          {idx + 1}. {statusLabel(step)}
                        </span>
                      );
                    })}
                    {order.fulfillmentStatus === "cancelled" && (
                      <span className="px-3 py-1 rounded-full border bg-rose-50 text-rose-700 border-rose-100">
                        Cancelled
                      </span>
                    )}
                  </div>
                </div>

                {isSeller && nextStatuses.length > 0 && (
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <p className="text-sm font-medium text-slate-900">
                      Update status
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {nextStatuses.map((st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={updating}
                          onClick={() => handleStatusChange(st)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${st === "cancelled"
                            ? "border-rose-500 text-rose-700 hover:bg-rose-50"
                            : "border-slate-300 text-slate-700 hover:bg-slate-100"
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                          {statusLabel(st)}
                        </button>
                      ))}
                    </div>
                    {updateError && (
                      <p className="text-xs text-rose-600">{updateError}</p>
                    )}
                    {updateSuccess && (
                      <p className="text-xs text-emerald-600">
                        {updateSuccess}
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* Review Section - Only for buyers on completed orders */}
              {canReview && (
                <section className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        How was your experience?
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Share your feedback about this purchase and help other students make informed decisions.
                      </p>
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors"
                      >
                        Write a Review
                      </button>
                    </div>
                    <div className="text-4xl">⭐</div>
                  </div>
                </section>
              )}

              {/* Show if already reviewed */}
              {isBuyer && order.isReviewed && (
                <section className="bg-white border-2 border-green-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-green-600 text-2xl">✓</span>
                    <span className="text-lg font-semibold text-gray-900">Thank you for your feedback!</span>
                  </div>

                  {loadingReview ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-slate-600" />
                      <span>Loading your review...</span>
                    </div>
                  ) : existingReview ? (
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Your Review
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-xl ${star <= existingReview.rating
                                  ? "text-yellow-400"
                                  : "text-slate-300"
                                  }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-slate-700">
                            {existingReview.rating} out of 5
                          </span>
                        </div>
                        {existingReview.comment && (
                          <p className="text-sm text-slate-700 italic">
                            &ldquo;{existingReview.comment}&rdquo;
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Reviewed on {formatDateTime(existingReview.createdAt)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">Your review has been submitted successfully.</p>
                  )}
                </section>
              )}

              {/* Payment + addresses */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2 text-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Payment method
                  </p>
                  {order.paymentMethod ? (
                    <>
                      <p className="text-slate-900 font-semibold">
                        {order.paymentMethod.cardHolderName}
                      </p>
                      <p className="text-slate-600">
                        **** **** **** {order.paymentMethod.last4} ·{" "}
                        {order.paymentMethod.expiryDate}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {order.paymentMethod.type} card
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-500">
                      No payment snapshot stored for this order.
                    </p>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2 text-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {deliveryType === "pickup"
                      ? "Pickup location"
                      : "Delivery address"}
                  </p>
                  {deliveryType === "pickup" ? (
                    order.deliveryDetails?.pickupAddress ? (
                      <>
                        <p className="text-slate-900">
                          {order.deliveryDetails.pickupAddress.line1}
                        </p>
                        {order.deliveryDetails.pickupAddress.line2 && (
                          <p className="text-slate-700 text-xs">
                            {order.deliveryDetails.pickupAddress.line2}
                          </p>
                        )}
                        <p className="text-slate-700 text-xs">
                          {order.deliveryDetails.pickupAddress.city},{" "}
                          {order.deliveryDetails.pickupAddress.state}{" "}
                          {order.deliveryDetails.pickupAddress.postalCode}
                        </p>
                        <p className="text-slate-700 text-xs">
                          {order.deliveryDetails.pickupAddress.country}
                        </p>
                      </>
                    ) : (
                      <p className="text-slate-500">
                        Seller will share pickup instructions separately.
                      </p>
                    )
                  ) : order.deliveryDetails?.shippingAddress ? (
                    <>
                      <p className="text-slate-900">
                        {order.deliveryDetails.shippingAddress.line1}
                      </p>
                      {order.deliveryDetails.shippingAddress.line2 && (
                        <p className="text-slate-700 text-xs">
                          {order.deliveryDetails.shippingAddress.line2}
                        </p>
                      )}
                      <p className="text-slate-700 text-xs">
                        {order.deliveryDetails.shippingAddress.city},{" "}
                        {order.deliveryDetails.shippingAddress.state}{" "}
                        {order.deliveryDetails.shippingAddress.postalCode}
                      </p>
                      <p className="text-slate-700 text-xs">
                        {order.deliveryDetails.shippingAddress.country}
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-500">
                      No address stored for this order.
                    </p>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* Review Modal */}
          {showReviewModal && order && (
            <ReviewModal
              order={order}
              onClose={handleCloseReviewModal}
              onSubmit={handleSubmitReview}
              onSkip={handleSkipReview}
            />
          )}
        </div>
      </div>
    </UserRoute>
  );
}


