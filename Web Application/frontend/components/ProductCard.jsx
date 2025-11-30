"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdShoppingCart, MdEdit, MdDelete } from "react-icons/md";

export default function ProductCard({ 
  product, 
  currentUserId, 
  onEdit, 
  onDelete 
}) {
  const [imageError, setImageError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Check if current user is the product owner
  const isOwner = currentUserId && (
    product.createdBy?._id === currentUserId || 
    product.createdBy === currentUserId
  );

  // Check if product is inactive (sold out) - sellers cannot edit/delete inactive products
  const isInactive = product?.status === "inactive";

  // Show management mode if user is owner, callbacks are provided, and product is not inactive
  const isManagementMode = isOwner && (onEdit || onDelete) && !isInactive;

  const handleViewDetails = (event) => {
    event.stopPropagation();
    if (product?._id) {
      router.push(`/product/${product._id}`);
    }
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    event.preventDefault();
    if (product?._id) {
      router.push(`/sell?edit=${product._id}`);
    } else if (onEdit) {
      // Fallback to callback if no product ID
      onEdit(product);
    }
  };

  const handleDelete = async (event) => {
    event.stopPropagation();
    if (window.confirm("Are you sure you want to delete this product?")) {
      setIsDeleting(true);
      if (onDelete) {
        await onDelete(product._id);
      }
      setIsDeleting(false);
    }
  };

  const getStatusBadge = () => {
    if (isManagementMode) {
      const statusColors = {
        active: "bg-emerald-600",
        inactive: "bg-slate-500",
        draft: "bg-amber-500",
      };
      return (
        <span
          className={`${statusColors[product.status] || "bg-slate-500"} text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow`}
        >
          {product.status}
        </span>
      );
    } else {
      // Regular view mode badges
      // Show "Inactive" if product status is inactive (sold out)
      if (product.status === "inactive") {
        return (
          <span className="absolute top-3 right-3 bg-slate-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow whitespace-nowrap">
            Inactive
          </span>
        );
      }
      // Show "Available" if product is active and has quantity
      if (product.status === "active" && product.quantity > 0) {
        return (
          <span className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow whitespace-nowrap">
            Available
          </span>
        );
      }
      // Show "Out of Stock" if quantity is 0 but status is not inactive
      if (product.quantity === 0) {
        return (
          <span className="absolute top-3 right-3 bg-rose-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow whitespace-nowrap">
            Out of Stock
          </span>
        );
      }
    }
    return null;
  };

  const cardContent = (
    <>
      {/* Product Image */}
      <div className="relative h-56 bg-slate-100 flex items-center justify-center overflow-hidden">
        {product.imageUrl && !imageError ? (
          <img
            src={`http://localhost:8800/${product.imageUrl}`}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full text-slate-400">
            <MdShoppingCart size={64} />
          </div>
        )}
        {/* Status Badge */}
        {getStatusBadge() && (
          <div className="absolute top-3 right-3">
            {getStatusBadge()}
          </div>
        )}
        {/* Category Badge */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
          {product.category}
        </span>
      </div>

      {/* Product Details */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Condition Badge */}
        {product.condition && (
          <div className="mb-2">
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
              product.condition === "Brand New" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
              product.condition === "Like New" ? "bg-sky-50 text-sky-700 border border-sky-100" :
              product.condition === "Good" ? "bg-amber-50 text-amber-700 border border-amber-100" :
              product.condition === "Used" ? "bg-slate-50 text-slate-700 border border-slate-200" :
              "bg-rose-50 text-rose-700 border border-rose-100"
            }`}>
              {product.condition}
            </span>
          </div>
        )}

        {/* Product Name */}
        <h3 className="text-gray-900 font-semibold text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
          {product.name}
        </h3>

        {/* Description - Always render container to maintain consistent spacing */}
        <div className="mb-4 min-h-[2.5rem]">
          {product.description ? (
            <p className="text-gray-600 text-sm line-clamp-2">
              {product.description}
            </p>
          ) : (
            <p className="text-gray-600 text-sm opacity-0 pointer-events-none">
              &nbsp;
            </p>
          )}
        </div>

        {/* Price and Quantity */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-3xl font-semibold text-slate-900">
              ${product.price.toFixed(2)}
            </span>
          </div>
          <span className="text-gray-500 text-sm font-medium bg-slate-100 px-3 py-1 rounded-full">
            Qty: {product.quantity}
          </span>
        </div>

        {/* Seller Info - Always show when available */}
        {product.createdBy && (
          <div className="flex items-center text-gray-600 text-sm mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-semibold text-xs mr-2">
              {product.createdBy.firstName?.[0]}{product.createdBy.lastName?.[0]}
            </div>
            <span className="text-gray-700">
              {product.createdBy.firstName} {product.createdBy.lastName}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        {isManagementMode ? (
          <div className="flex gap-3">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
              >
                <MdEdit size={18} />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MdDelete size={18} />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        ) : (
          <button
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              product.quantity > 0
                ? "bg-slate-900 text-white hover:bg-slate-700"
                : "bg-slate-200 text-gray-500 cursor-not-allowed"
            }`}
            onClick={handleViewDetails}
            disabled={product.quantity === 0}
          >
            {product.quantity > 0 ? "View Details" : "Out of Stock"}
          </button>
        )}
      </div>
    </>
  );

  // Always wrap in Link so owners can navigate to product detail page
  // Edit/Delete buttons use stopPropagation to prevent navigation when clicked
  return (
    <Link
      href={`/product/${product._id}`}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-slate-200 flex flex-col h-full cursor-pointer"
    >
      {cardContent}
    </Link>
  );
}
