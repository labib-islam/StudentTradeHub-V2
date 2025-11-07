"use client";

import { useState } from "react";
import { MdCreditCard } from "react-icons/md";

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

      const res = await fetch("http://localhost:8800/api/users/payment/add", {
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
    <div className="bg-white text-slate-900 rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 border border-slate-300 hover:border-slate-500 max-w-md mx-auto mt-10">
      <div className="flex items-center gap-2 bg-slate-100 p-4 border-b border-slate-300">
        <MdCreditCard size={24} className="text-slate-700" />
        <h2 className="text-xl font-semibold text-slate-800">Add Payment Method</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Cardholder Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cardholder Name</label>
          <input
            type="text"
            name="cardName"
            value={formData.cardName}
            onChange={handleChange}
            placeholder="Full name as on card"
            required
            className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Card Number */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Card Number</label>
          <input
            type="text"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
            maxLength={16}
            inputMode="numeric"
            required
            className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
          <input
            type="text"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            placeholder="MM/YY"
            required
            className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* CVV */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">CVV</label>
          <input
            type="password"
            name="cvv"
            value={formData.cvv}
            onChange={handleChange}
            placeholder="123"
            maxLength={4}
            inputMode="numeric"
            required
            className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Card Type Dropdown */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Card Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-900"
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
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
            loading ? "bg-slate-400 cursor-not-allowed text-white" : "bg-slate-800 hover:bg-slate-900 text-white"
          }`}
        >
          {loading ? "Saving..." : "Add Payment Method"}
        </button>
      </form>
    </div>
  );
}
