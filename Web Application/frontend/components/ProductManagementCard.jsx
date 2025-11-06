"use client";
import { useState } from "react";
import { MdEdit, MdDelete, MdShoppingCart } from "react-icons/md";

export default function ProductManagementCard({ product, onEdit, onDelete }) {
  const [imageError, setImageError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setIsDeleting(true);
      await onDelete(product._id);
      setIsDeleting(false);
    }
  };

  const getStatusBadge = () => {
    const statusColors = {
      active: "bg-green-500",
      inactive: "bg-gray-500",
      draft: "bg-yellow-500",
    };

    return (
      <span
        className={`${statusColors[product.status]
          } text-white text-xs font-semibold px-2 py-1 rounded uppercase`}
      >
        {product.status}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-300 hover:shadow-lg transition-shadow duration-300">
      {/* Product Image */}
      <div className="relative h-48 bg-slate-200 flex items-center justify-center overflow-hidden">
        {product.imageUrl && !imageError ? (
          <img
            src={`http://localhost:8800/${product.imageUrl}`}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full text-gray-400">
            <MdShoppingCart size={64} />
          </div>
        )}
        {/* Status Badge */}
        <div className="absolute top-2 right-2">{getStatusBadge()}</div>
      </div>

      {/* Product Details */}
      <div className="p-4">
        {/* Category and Condition */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-600 text-xs font-medium uppercase tracking-wide">
            {product.category}
          </span>
          {product.condition && (
            <span className={`text-xs font-semibold px-2 py-1 rounded ${product.condition === "Brand New" ? "bg-blue-100 text-blue-800" :
                product.condition === "Like New" ? "bg-green-100 text-green-800" :
                  product.condition === "Good" ? "bg-yellow-100 text-yellow-800" :
                    product.condition === "Used" ? "bg-gray-100 text-gray-800" :
                      "bg-red-100 text-red-800"
              }`}>
              {product.condition}
            </span>
          )}
        </div>

        {/* Product Name */}
        <h3 className="text-black font-semibold text-lg mb-2 line-clamp-1">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">
          {product.description || "\u00A0"}
        </p>

        {/* Price and Quantity */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-300">
          <span className="text-2xl font-bold text-slate-800">
            ${product.price.toFixed(2)}
          </span>
          <span className="text-gray-600 text-sm">Qty: {product.quantity}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(product)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md transition-colors duration-200"
          >
            <MdEdit size={18} />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdDelete size={18} />
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
