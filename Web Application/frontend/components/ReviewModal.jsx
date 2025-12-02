"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8800";

const ReviewModal = ({ order, onClose, onSubmit, onSkip }) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }
        setIsSubmitting(true);
        await onSubmit(order._id, rating, comment);
        setIsSubmitting(false);
    };

    const handleSkip = async () => {
        setIsSubmitting(true);
        await onSkip(order._id);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">Rate Your Experience</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                            disabled={isSubmitting}
                        >
                            ×
                        </button>
                    </div>

                    {/* Product Info */}
                    <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {order.product?.imageUrl ? (
                                    <img
                                        src={`${API_URL}/${order.product.imageUrl}`}
                                        alt={order.product?.name || "Product"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-slate-400 text-xs">No image</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">
                                    {order.product?.name || "Product"}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Seller: {order.seller?.firstName} {order.seller?.lastName}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Rating */}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                                How was your experience?
                            </label>
                            <div className="flex gap-2 justify-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        className="text-4xl transition-transform hover:scale-110"
                                        disabled={isSubmitting}
                                    >
                                        <span
                                            className={
                                                star <= (hoveredRating || rating)
                                                    ? 'text-yellow-400'
                                                    : 'text-gray-300'
                                            }
                                        >
                                            ★
                                        </span>
                                    </button>
                                ))}
                            </div>
                            {rating > 0 && (
                                <p className="text-center mt-2 text-sm text-gray-600">
                                    {rating === 1 && 'Poor'}
                                    {rating === 2 && 'Fair'}
                                    {rating === 3 && 'Good'}
                                    {rating === 4 && 'Very Good'}
                                    {rating === 5 && 'Excellent'}
                                </p>
                            )}
                        </div>

                        {/* Comment */}
                        <div className="mb-6">
                            <label htmlFor="comment" className="block text-sm font-semibold text-gray-900 mb-2">
                                Share your experience (optional)
                            </label>
                            <textarea
                                id="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
                                placeholder="Tell others about your experience..."
                                rows="4"
                                maxLength="500"
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-gray-500 mt-1">{comment.length}/500 characters</p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-gray-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                Skip
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
