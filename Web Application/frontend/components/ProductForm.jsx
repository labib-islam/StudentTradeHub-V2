"use client";
import { useState } from "react";
import { MdCloudUpload } from "react-icons/md";

export default function ProductForm({
    initialData = null,
    onSubmit,
    onCancel,
    loading = false,
    submitButtonText = "Create Product"
}) {
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        description: initialData?.description || "",
        price: initialData?.price || "",
        category: initialData?.category || "",
        quantity: initialData?.quantity || "",
        status: initialData?.status || "active",
        condition: initialData?.condition || "Good",
        image: null,
    });
    const [imagePreview, setImagePreview] = useState(initialData?.imageUrl || null);
    const [error, setError] = useState(null);

    const categories = [
        "Electronics",
        "Books",
        "Furniture",
        "Clothing",
        "Sports & Outdoors",
        "Tools",
        "Home & Kitchen",
        "Other",
    ];

    const conditions = [
        "Brand New",
        "Like New",
        "Good",
        "Used",
        "Damaged",
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        console.log("Form data:", formData);
        setError(null);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith("image/")) {
                setError("Please select a valid image file");
                return;
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError("Image size should be less than 5MB");
                return;
            }

            setFormData((prev) => ({
                ...prev,
                image: file,
            }));

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
            setError(null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);
        console.log("Submitting form data:", formData);

        // Validation
        if (!formData.name || !formData.price || !formData.category || !formData.quantity) {
            setError("Please fill in all required fields");
            return;
        }

        if (parseFloat(formData.price) <= 0) {
            setError("Price must be greater than 0");
            return;
        }

        if (parseInt(formData.quantity) < 0) {
            setError("Quantity cannot be negative");
            return;
        }

        // For new products, image is required
        if (!initialData && !formData.image) {
            setError("Please upload a product image");
            return;
        }

        onSubmit(formData, setError);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200 max-w-4xl mx-auto">
            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    <p className="font-semibold flex items-center gap-2">
                        <span className="text-red-500">⚠</span> Error
                    </p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}

            {/* Product Name */}
            <div className="mb-6">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                    Product Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                    placeholder="Enter product name"
                    required
                    disabled={loading}
                />
            </div>

            {/* Description */}
            <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white resize-none"
                    placeholder="Describe your product..."
                    disabled={loading}
                />
            </div>

            {/* Price and Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Price */}
                <div>
                    <label htmlFor="price" className="block text-sm font-semibold text-gray-900 mb-2">
                        Price ($) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                            placeholder="0.00"
                            required
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Quantity */}
                <div>
                    <label htmlFor="quantity" className="block text-sm font-semibold text-gray-900 mb-2">
                        Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                        placeholder="1"
                        required
                        disabled={loading}
                    />
                </div>
            </div>

            {/* Category, Condition, and Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Category */}
                <div>
                    <label htmlFor="category" className="block text-sm font-semibold text-gray-900 mb-2">
                        Category <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                        required
                        disabled={loading}
                    >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Condition */}
                <div>
                    <label htmlFor="condition" className="block text-sm font-semibold text-gray-900 mb-2">
                        Condition <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="condition"
                        name="condition"
                        value={formData.condition}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                        required
                        disabled={loading}
                    >
                        {conditions.map((cond) => (
                            <option key={cond} value={cond}>
                                {cond}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status */}
                <div>
                    <label htmlFor="status" className="block text-sm font-semibold text-gray-900 mb-2">
                        Status
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status === "inactive" ? "active" : formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                        disabled={loading || initialData?.status === "inactive"}
                    >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                    </select>
                    {initialData?.status === "inactive" && (
                        <p className="text-xs text-slate-500 mt-1">
                            Status cannot be changed - product is sold out
                        </p>
                    )}
                </div>
            </div>

            {/* Image Upload */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Product Image {!initialData && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-center justify-center w-full">
                    <label
                        htmlFor="image"
                        className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors group"
                    >
                        {imagePreview ? (
                            <div className="relative w-full h-full">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="h-full w-full object-contain rounded-lg"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200 flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 text-white font-semibold bg-blue-600 px-4 py-2 rounded-lg transition-opacity">
                                        Click to change
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <MdCloudUpload className="w-16 h-16 mb-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                <p className="mb-2 text-sm text-gray-600">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                    PNG, JPG, JPEG (MAX. 5MB)
                                </p>
                            </div>
                        )}
                        <input
                            id="image"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                            disabled={loading}
                        />
                    </label>
                </div>
                {initialData && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        Leave empty to keep the current image
                    </p>
                )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 border border-slate-300 text-gray-700 rounded-lg hover:bg-slate-100 font-semibold transition-colors"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-8 py-3 bg-slate-900 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                >
                    {loading ? "Saving..." : submitButtonText}
                </button>
            </div>
        </form>
    );
}
