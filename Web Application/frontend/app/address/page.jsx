"use client";

import { useEffect, useState } from "react";
import UserRoute from "@/components/UserRoute";
import { fetchUserPreferences, updateUserPreferences } from "@/libs/utlis";

const emptyAddress = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Canada",
};

export default function AddressPreferencesPage() {
  const [deliveryAddress, setDeliveryAddress] = useState(emptyAddress);
  const [pickupAddress, setPickupAddress] = useState(emptyAddress);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const prefs = await fetchUserPreferences();
        if (prefs.deliveryAddress) {
          setDeliveryAddress({ ...emptyAddress, ...prefs.deliveryAddress });
        }
        if (prefs.pickupAddress) {
          setPickupAddress({ ...emptyAddress, ...prefs.pickupAddress });
        }
      } catch (err) {
        setError(err.message || "Failed to load address preferences.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange =
    (type, field) =>
    (e) => {
      const value = e.target.value;
      if (type === "delivery") {
        setDeliveryAddress((prev) => ({ ...prev, [field]: value }));
      } else {
        setPickupAddress((prev) => ({ ...prev, [field]: value }));
      }
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setSaving(true);
      await updateUserPreferences({
        deliveryAddress,
        pickupAddress,
      });
      setSuccess("Address preferences updated.");
    } catch (err) {
      setError(err.message || "Failed to update address preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <UserRoute>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Settings
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 mt-1">
              Address preferences
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl">
              Save your delivery and pickup addresses so you don&apos;t have to
              re-enter them during checkout.
            </p>
          </header>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-600" />
                <p className="text-gray-600 font-medium">
                  Loading your addresses...
                </p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8"
            >
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm">
                  {success}
                </div>
              )}

              {/* Delivery Address */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Delivery address
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 mb-1">
                      Address line 1
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                      value={deliveryAddress.line1}
                      onChange={handleChange("delivery", "line1")}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 mb-1">
                      Address line 2
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                      value={deliveryAddress.line2}
                      onChange={handleChange("delivery", "line2")}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">City</label>
                    <input
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                      value={deliveryAddress.city}
                      onChange={handleChange("delivery", "city")}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">
                      State / Province
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                      value={deliveryAddress.state}
                      onChange={handleChange("delivery", "state")}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">
                      Postal code
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                      value={deliveryAddress.postalCode}
                      onChange={handleChange("delivery", "postalCode")}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">Country</label>
                    <input
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                      value={deliveryAddress.country}
                      onChange={handleChange("delivery", "country")}
                    />
                  </div>
                </div>
              </section>

              {/* Pickup Address */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Pickup address (for items you sell)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 mb-1">
                      Address line 1
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                      value={pickupAddress.line1}
                      onChange={handleChange("pickup", "line1")}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 mb-1">
                      Address line 2
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                      value={pickupAddress.line2}
                      onChange={handleChange("pickup", "line2")}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">City</label>
                    <input
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                      value={pickupAddress.city}
                      onChange={handleChange("pickup", "city")}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">
                      State / Province
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                      value={pickupAddress.state}
                      onChange={handleChange("pickup", "state")}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">
                      Postal code
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                      value={pickupAddress.postalCode}
                      onChange={handleChange("pickup", "postalCode")}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">Country</label>
                    <input
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                      value={pickupAddress.country}
                      onChange={handleChange("pickup", "country")}
                    />
                  </div>
                </div>
              </section>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </UserRoute>
  );
}


