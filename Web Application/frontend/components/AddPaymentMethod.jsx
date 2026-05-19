"use client";

import { useState } from "react";
import { MdCreditCard } from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8800";

export default function AddPaymentMethod() {
  const [formData, setFormData] = useState({
    cardName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    type: "", // card type
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You are not logged in. No token found.");
        setLoading(false);
        return;
      }

      // Map frontend fields to backend schema
      const bodyToSend = {
        cardHolderName: formData.cardName,
        cardNumber: formData.cardNumber,
        expiryDate: formData.expiryDate,
        cvv: formData.cvv,
        type: formData.type, // must match schema enum
      };

      const res = await fetch(`${API_URL}/api/users/payment/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyToSend),
      });

      let body;
      try {
        body = await res.json();
      } catch {
        body = await res.text();
      }

      if (res.ok) {
        alert("✅ Payment method added successfully!");
        setFormData({ cardName: "", cardNumber: "", expiryDate: "", cvv: "", type: "" });
      } else {
        alert(`❌ ${typeof body === "object" ? body.message || JSON.stringify(body) : body}`);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("❌ Failed to connect to server. Check console and server logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white text-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 max-w-md mx-auto mt-10">
      <div className="flex items-center gap-3 bg-slate-100 p-6 border-b border-slate-200">
        <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center">
          <MdCreditCard size={24} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Add Payment Method</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Cardholder Name */}
        <div>
          <label htmlFor="cardName" className="block text-sm font-semibold text-gray-900 mb-2">Cardholder Name</label>
          <input
            type="text"
            id="cardName"
            name="cardName"
            value={formData.cardName}
            onChange={handleChange}
            placeholder="Full name as on card"
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Card Number */}
        <div>
          <label htmlFor="cardNumber" className="block text-sm font-semibold text-gray-900 mb-2">Card Number</label>
          <input
            type="text"
            id="cardNumber"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
            maxLength={16}
            inputMode="numeric"
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Expiry Date and CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="expiryDate" className="block text-sm font-semibold text-gray-900 mb-2">Expiry Date</label>
            <input
              type="text"
              id="expiryDate"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              placeholder="MM/YY"
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="cvv" className="block text-sm font-semibold text-gray-900 mb-2">CVV</label>
            <input
              type="password"
              id="cvv"
              name="cvv"
              value={formData.cvv}
              onChange={handleChange}
              placeholder="123"
              maxLength={4}
              inputMode="numeric"
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Card Type Dropdown */}
        <div>
          <label htmlFor="type" className="block text-sm font-semibold text-gray-900 mb-2">Card Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Select card type</option>
            <option value="Credit">Credit</option>
            <option value="Debit">Debit</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-semibold ${loading
              ? "bg-slate-400 cursor-not-allowed text-white"
              : "bg-slate-900 hover:bg-slate-700 text-white transition-colors"
            }`}
        >
          {loading ? "Saving..." : "Add Payment Method"}
        </button>
      </form>
    </div>
  );
}
