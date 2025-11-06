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
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 border border-slate-300">
            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Product Name */}
            <div className="mb-6">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-400 rounded-md text-black focus:outline-none focus:border-slate-600"
                    placeholder="Enter product name"
                    required
                    disabled={loading}
                />
            </div>

            {/* Description */}
            <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-2 border border-slate-400 rounded-md text-black focus:outline-none focus:border-slate-600"
                    placeholder="Describe your product..."
                    disabled={loading}
                />
            </div>

            {/* Price and Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Price */}
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                        Price ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-2 border border-slate-400 rounded-md text-black focus:outline-none focus:border-slate-600"
                        placeholder="0.00"
                        required
                        disabled={loading}
                    />
                </div>

                {/* Quantity */}
                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-2 border border-slate-400 rounded-md text-black focus:outline-none focus:border-slate-600"
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
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                        Category <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-400 rounded-md text-black focus:outline-none focus:border-slate-600"
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
                    <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                        Condition <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="condition"
                        name="condition"
                        value={formData.condition}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-400 rounded-md text-black focus:outline-none focus:border-slate-600"
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
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-400 rounded-md text-black focus:outline-none focus:border-slate-600"
                        disabled={loading}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
            </div>

            {/* Image Upload */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image {!initialData && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-center justify-center w-full">
                    <label
                        htmlFor="image"
                        className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-400 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100"
                    >
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="h-full w-full object-contain rounded-lg"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <MdCloudUpload className="w-16 h-16 mb-3 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-500">
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
                    <p className="text-xs text-gray-500 mt-2">
                        Leave empty to keep the current image
                    </p>
                )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 border border-slate-400 text-gray-700 rounded-md hover:bg-slate-100 transition-colors duration-200"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                >
                    {loading ? "Saving..." : submitButtonText}
                </button>
            </div>
        </form>
    );
}
