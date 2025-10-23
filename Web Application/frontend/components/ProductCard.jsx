"use client";
import { useState } from "react";
import { MdShoppingCart, MdPerson } from "react-icons/md";

export default function ProductCard({ product }) {
    const [imageError, setImageError] = useState(false);

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 border border-slate-300 hover:border-slate-500 flex flex-col h-full">
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
                {product.status === "active" && product.quantity > 0 && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        Available
                    </span>
                )}
                {product.quantity === 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        Out of Stock
                    </span>
                )}
            </div>

            {/* Product Details */}
            <div className="p-4 flex flex-col flex-grow">
                {/* Category */}
                <span className="text-slate-600 text-xs font-medium uppercase tracking-wide mb-1">
                    {product.category}
                </span>

                {/* Product Name */}
                <h3 className="text-black font-semibold text-lg mb-2 line-clamp-2">
                    {product.name}
                </h3>

                {/* Description */}
                {product.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">
                        {product.description}
                    </p>
                )}

                {/* Price and Quantity */}
                <div className="flex justify-between items-center mb-3">
                    <span className="text-2xl font-bold text-slate-800">
                        ${product.price.toFixed(2)}
                    </span>
                    <span className="text-gray-600 text-sm">
                        Qty: {product.quantity}
                    </span>
                </div>

                {/* Seller Info */}
                {product.createdBy && (
                    <div className="flex items-center text-gray-600 text-sm mb-3 pb-3 border-b border-slate-300">
                        <MdPerson className="mr-1" />
                        <span>
                            Seller: {product.createdBy.firstName} {product.createdBy.lastName}
                        </span>
                    </div>
                )}

                {/* Action Button */}
                <button
                    className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-200 ${product.quantity > 0
                        ? "bg-slate-800 hover:bg-slate-900 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                    disabled={product.quantity === 0}
                >
                    {product.quantity > 0 ? "Contact Seller" : "Out of Stock"}
                </button>
            </div>
        </div>
    );
}
