"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import UserRoute from "@/components/UserRoute";
import {
  fetchProductById,
  fetchUserPreferences,
  createOrder,
} from "@/libs/utlis";

const emptyPayment = {
  cardHolderName: "",
  cardNumber: "",
  expiryDate: "",
  type: "Credit",
};

const emptyAddress = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Canada",
};

const fulfillmentCopy = {
  pickup: [
    { key: "pending", label: "Pending", description: "Order received" },
    { key: "ready_for_pickup", label: "Ready for pickup", description: "Seller prepared your item" },
    { key: "picked_up", label: "Picked up", description: "Item collected" },
  ],
  deliver: [
    { key: "pending", label: "Pending", description: "Order received" },
    { key: "confirmed", label: "Accepted", description: "Seller accepted order" },
    { key: "out_for_delivery", label: "On the way", description: "Courier en route" },
    { key: "delivered", label: "Delivered", description: "Package delivered" },
  ],
};

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [preferences, setPreferences] = useState({
    paymentMethod: null,
    deliveryAddress: null,
    pickupAddress: null,
  });
  const [deliveryType, setDeliveryType] = useState("pickup");
  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [useSavedPayment, setUseSavedPayment] = useState(true);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [savePayment, setSavePayment] = useState(true);
  const [saveAddress, setSaveAddress] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      if (!productId) {
        setError("No product selected for purchase.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [productData, preferenceData] = await Promise.all([
          fetchProductById(productId),
          fetchUserPreferences(),
        ]);
        setProduct(productData);
        setPreferences(preferenceData);
        setUseSavedPayment(!!preferenceData.paymentMethod);
        setUseSavedAddress(!!preferenceData.deliveryAddress);
        // Reset quantity to 1 (or 0 if product is out of stock)
        setQuantity(productData.quantity > 0 ? 1 : 0);
        if (preferenceData.deliveryAddress) {
          setAddressForm({
            ...emptyAddress,
            ...preferenceData.deliveryAddress,
          });
        }
        if (productData?.createdBy?.pickupAddress) {
          setPreferences((prev) => ({
            ...prev,
            pickupAddress: productData.createdBy.pickupAddress,
          }));
          setDeliveryType("pickup");
        } else {
          setPreferences((prev) => ({
            ...prev,
            pickupAddress: null,
          }));
          setDeliveryType("deliver");
        }
      } catch (err) {
        setError(err.message || "Failed to load checkout data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId]);

  const handlePaymentChange = (field, value) => {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const hasPickupOption = !!preferences.pickupAddress;

  useEffect(() => {
    if (!hasPickupOption && deliveryType === "pickup") {
      setDeliveryType("deliver");
    }
  }, [hasPickupOption, deliveryType]);

  // Ensure quantity doesn't exceed available quantity
  useEffect(() => {
    if (product && quantity > product.quantity) {
      setQuantity(Math.max(1, product.quantity));
    }
  }, [product, quantity]);

  const statusSteps = useMemo(
    () => fulfillmentCopy[deliveryType] || [],
    [deliveryType]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!product?._id) {
      setError("Product information missing.");
      return;
    }

    if (!useSavedPayment) {
      if (!paymentForm.cardHolderName || !paymentForm.cardNumber || !paymentForm.expiryDate) {
        setError("Please complete the payment form.");
        return;
      }
    }

    if (deliveryType === "deliver" && !useSavedAddress) {
      if (!addressForm.line1 || !addressForm.city || !addressForm.postalCode) {
        setError("Please provide a delivery address.");
        return;
      }
    }

    // Validate quantity
    const quantityNum = parseInt(quantity, 10);
    if (isNaN(quantityNum) || quantityNum < 1) {
      setError("Please select a valid quantity.");
      return;
    }
    if (quantityNum > product.quantity) {
      setError(`Only ${product.quantity} item(s) available.`);
      return;
    }

    const payload = {
      productId: product._id,
      quantity: quantityNum,
      paymentMethod: useSavedPayment ? null : paymentForm,
      deliveryOption: {
        type: deliveryType,
        address:
          deliveryType === "deliver"
            ? useSavedAddress
              ? null
              : addressForm
            : null,
      },
      savePaymentMethod: !useSavedPayment && savePayment,
      saveDeliveryAddress:
        deliveryType === "deliver" && !useSavedAddress && saveAddress,
    };

    try {
      setSubmitting(true);
      const response = await createOrder(payload);
      setSuccess("Purchase confirmed! Redirecting to order details...");
      setTimeout(() => {
        if (response?.order?._id) {
          router.push(`/orders/${response.order._id}`);
        } else {
          router.push("/orders");
        }
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserRoute>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Checkout
              </p>
              <h1 className="text-3xl font-semibold text-slate-900 mt-1">
                Complete your purchase
              </h1>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-600" />
                <p className="text-gray-600 font-medium">Loading checkout...</p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl mb-6">
              <p className="font-semibold text-lg mb-1">There was a problem</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && product && (
            <form
              onSubmit={handleSubmit}
              className="space-y-6 text-sm md:text-base"
            >
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl">
                  {success}
                </div>
              )}

              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Order Summary
                </h2>
                <div className="flex flex-col gap-2 text-slate-700">
                  <div className="flex justify-between">
                    <span>{product.name}</span>
                    <span className="font-semibold">
                      ${Number(product.price || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-slate-500">Quantity</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={product.quantity}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1 && val <= product.quantity) {
                            setQuantity(val);
                          }
                        }}
                        className="w-16 px-2 py-1 text-center border border-slate-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                        disabled={quantity >= product.quantity}
                        className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                      <span className="text-sm text-slate-500 ml-2">
                        of {product.quantity} available
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-semibold text-slate-900">
                      ${(Number(product.price || 0) * quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Seller</span>
                    <span>
                      {product.createdBy?.firstName} {product.createdBy?.lastName}
                    </span>
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4 flex items-center gap-3">
                  <p className="text-sm uppercase text-slate-500 tracking-wide">
                    Status pipeline
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                    {statusSteps.map((step, index) => (
                      <span
                        key={step.key}
                        className="px-3 py-1 rounded-full bg-slate-100 text-slate-700"
                      >
                        {index + 1}. {step.label}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Payment Method
                  </h2>
                  {preferences.paymentMethod && (
                    <button
                      type="button"
                      className="text-sm text-slate-600 hover:text-slate-900"
                      onClick={() => setUseSavedPayment((prev) => !prev)}
                    >
                      {useSavedPayment ? "Use a different card" : "Use saved card"}
                    </button>
                  )}
                </div>

                {useSavedPayment && preferences.paymentMethod ? (
                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 text-sm">
                    <p className="font-semibold text-slate-900">
                      {preferences.paymentMethod.cardHolderName}
                    </p>
                    <p className="text-slate-600">
                      **** **** **** {preferences.paymentMethod.last4} ·{" "}
                      {preferences.paymentMethod.expiryDate}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {preferences.paymentMethod.type} card
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-500">Cardholder Name</label>
                        <input
                          type="text"
                          className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg"
                          value={paymentForm.cardHolderName}
                          onChange={(e) =>
                            handlePaymentChange("cardHolderName", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-500">Card Number</label>
                        <input
                          type="text"
                          className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg"
                          value={paymentForm.cardNumber}
                          onChange={(e) =>
                            handlePaymentChange("cardNumber", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-500">Expiry Date</label>
                        <input
                          type="text"
                          className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg"
                          placeholder="MM/YY"
                          value={paymentForm.expiryDate}
                          onChange={(e) =>
                            handlePaymentChange("expiryDate", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-500">Card Type</label>
                        <select
                          className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg"
                          value={paymentForm.type}
                          onChange={(e) => handlePaymentChange("type", e.target.value)}
                        >
                          <option value="Credit">Credit</option>
                          <option value="Debit">Debit</option>
                        </select>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={savePayment}
                        onChange={(e) => setSavePayment(e.target.checked)}
                      />
                      Save this card for future orders
                    </label>
                  </>
                )}
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Delivery Preferences
                  </h2>
                </div>

                <div className="flex gap-4">
                  {hasPickupOption && (
                    <button
                      type="button"
                      className={`flex-1 px-4 py-3 rounded-lg border ${deliveryType === "pickup"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 text-slate-700"
                        }`}
                      onClick={() => setDeliveryType("pickup")}
                    >
                      Pickup
                    </button>
                  )}
                  <button
                    type="button"
                    className={`flex-1 px-4 py-3 rounded-lg border ${deliveryType === "deliver"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 text-slate-700"
                      }`}
                    onClick={() => setDeliveryType("deliver")}
                  >
                    Deliver
                  </button>
                </div>

                {deliveryType === "pickup" ? (
                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 text-sm">
                    <p className="font-semibold text-slate-900 mb-1">
                      Pickup location
                    </p>
                    {preferences.pickupAddress ? (
                      <div className="text-slate-600">
                        <p>{preferences.pickupAddress.line1}</p>
                        {preferences.pickupAddress.line2 && (
                          <p>{preferences.pickupAddress.line2}</p>
                        )}
                        <p>
                          {preferences.pickupAddress.city},{" "}
                          {preferences.pickupAddress.state}{" "}
                          {preferences.pickupAddress.postalCode}
                        </p>
                        <p>{preferences.pickupAddress.country}</p>
                      </div>
                    ) : (
                      <p className="text-slate-500">
                        Seller will provide pickup instructions after purchase.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {preferences.deliveryAddress && (
                      <button
                        type="button"
                        className="text-sm text-slate-600 hover:text-slate-900"
                        onClick={() => setUseSavedAddress((prev) => !prev)}
                      >
                        {useSavedAddress
                          ? "Use a different address"
                          : "Use saved address"}
                      </button>
                    )}

                    {useSavedAddress && preferences.deliveryAddress ? (
                      <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 text-sm">
                        <p className="font-semibold text-slate-900 mb-1">
                          Shipping address
                        </p>
                        <div className="text-slate-600">
                          <p>{preferences.deliveryAddress.line1}</p>
                          {preferences.deliveryAddress.line2 && (
                            <p>{preferences.deliveryAddress.line2}</p>
                          )}
                          <p>
                            {preferences.deliveryAddress.city},{" "}
                            {preferences.deliveryAddress.state}{" "}
                            {preferences.deliveryAddress.postalCode}
                          </p>
                          <p>{preferences.deliveryAddress.country}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="text-sm text-slate-500">Address line 1</label>
                            <input
                              className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg"
                              value={addressForm.line1}
                              onChange={(e) =>
                                handleAddressChange("line1", e.target.value)
                              }
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm text-slate-500">Address line 2</label>
                            <input
                              className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg"
                              value={addressForm.line2}
                              onChange={(e) =>
                                handleAddressChange("line2", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label className="text-sm text-slate-500">City</label>
                            <input
                              className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg"
                              value={addressForm.city}
                              onChange={(e) =>
                                handleAddressChange("city", e.target.value)
                              }
                              required
                            />
                          </div>
                          <div>
                            <label className="text-sm text-slate-500">State/Province</label>
                            <input
                              className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg"
                              value={addressForm.state}
                              onChange={(e) =>
                                handleAddressChange("state", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label className="text-sm text-slate-500">Postal Code</label>
                            <input
                              className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg"
                              value={addressForm.postalCode}
                              onChange={(e) =>
                                handleAddressChange("postalCode", e.target.value)
                              }
                              required
                            />
                          </div>
                          <div>
                            <label className="text-sm text-slate-500">Country</label>
                            <input
                              className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg"
                              value={addressForm.country}
                              onChange={(e) =>
                                handleAddressChange("country", e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={saveAddress}
                            onChange={(e) => setSaveAddress(e.target.checked)}
                          />
                          Save this address for future orders
                        </label>
                      </>
                    )}
                  </div>
                )}
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex justify-between text-lg font-semibold text-slate-900">
                  <span>Total</span>
                  <span>${Number(product.price || 0).toFixed(2)}</span>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-slate-900 hover:bg-slate-700 text-white rounded-lg font-semibold disabled:opacity-60"
                >
                  {submitting ? "Processing..." : "Confirm Purchase"}
                </button>
              </section>
            </form>
          )}
        </div>
      </div>
    </UserRoute>
  );
}

