'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ReviewModal from './ReviewModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8800";

const ReviewPrompt = () => {
    const { user } = useAuth();
    const [pendingOrders, setPendingOrders] = useState([]);
    const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        // Only check once per session
        if (user && !hasChecked) {
            checkPendingReviews();
            setHasChecked(true);
        }
    }, [user, hasChecked]);

    const checkPendingReviews = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/api/reviews/pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.pendingOrders && data.pendingOrders.length > 0) {
                    setPendingOrders(data.pendingOrders);
                    setShowModal(true);
                }
            }
        } catch (err) {
            console.error('Error fetching pending reviews:', err);
        }
    };

    const handleSubmitReview = async (orderId, rating, comment) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ orderId, rating, comment }),
            });

            if (response.ok) {
                // Move to next order or close modal
                if (currentOrderIndex < pendingOrders.length - 1) {
                    setCurrentOrderIndex(currentOrderIndex + 1);
                } else {
                    setShowModal(false);
                    setPendingOrders([]);
                }
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to submit review');
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            alert('An error occurred while submitting your review');
        }
    };

    const handleSkipReview = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/reviews/skip`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ orderId }),
            });

            if (response.ok) {
                // Move to next order or close modal
                if (currentOrderIndex < pendingOrders.length - 1) {
                    setCurrentOrderIndex(currentOrderIndex + 1);
                } else {
                    setShowModal(false);
                    setPendingOrders([]);
                }
            }
        } catch (err) {
            console.error('Error skipping review:', err);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        // Don't clear pending orders, so user can be reminded later
    };

    if (!showModal || pendingOrders.length === 0) {
        return null;
    }

    const currentOrder = pendingOrders[currentOrderIndex];

    return (
        <>
            {showModal && currentOrder && (
                <ReviewModal
                    order={currentOrder}
                    onClose={handleClose}
                    onSubmit={handleSubmitReview}
                    onSkip={handleSkipReview}
                />
            )}
            {pendingOrders.length > 1 && (
                <div className="fixed bottom-4 right-4 bg-white px-4 py-2 rounded-full shadow-lg text-sm text-gray-600 z-40">
                    Review {currentOrderIndex + 1} of {pendingOrders.length}
                </div>
            )}
        </>
    );
};

export default ReviewPrompt;
