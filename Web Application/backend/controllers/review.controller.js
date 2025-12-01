import Review from "../models/review.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";

// Create a review for a seller
const createReview = async (req, res) => {
    try {
        const { orderId, rating, comment } = req.body;
        const buyerId = req.userData.userId; // From auth middleware

        // Validate inputs
        if (!orderId || !rating) {
            return res.status(400).json({
                message: "Order ID and rating are required."
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5."
            });
        }

        // Find the order
        const order = await Order.findById(orderId).populate("seller product");
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        // Verify buyer owns this order
        if (order.buyer.toString() !== buyerId) {
            return res.status(403).json({
                message: "You can only review orders you purchased."
            });
        }

        // Verify order is completed (delivered or picked up)
        if (order.fulfillmentStatus !== "delivered" && order.fulfillmentStatus !== "picked_up") {
            return res.status(400).json({
                message: "You can only review completed orders."
            });
        }

        // Check if already reviewed
        if (order.isReviewed) {
            return res.status(400).json({
                message: "You have already reviewed this order."
            });
        }

        // Create the review
        const review = new Review({
            order: orderId,
            seller: order.seller._id,
            buyer: buyerId,
            product: order.product._id,
            rating,
            comment: comment || "",
        });

        await review.save();

        // Mark order as reviewed
        order.isReviewed = true;
        await order.save();

        // Update seller's rating statistics
        const sellerReviews = await Review.find({ seller: order.seller._id });
        const totalRating = sellerReviews.reduce((sum, rev) => sum + rev.rating, 0);
        const averageRating = totalRating / sellerReviews.length;

        await User.findByIdAndUpdate(order.seller._id, {
            "sellerRating.averageRating": averageRating,
            "sellerRating.totalReviews": sellerReviews.length,
        });

        res.status(201).json({
            message: "Review submitted successfully!",
            review
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
};

// Get reviews for a seller
const getSellerReviews = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const reviews = await Review.find({ seller: sellerId })
            .populate("buyer", "firstName lastName")
            .populate("product", "name imageUrl")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Review.countDocuments({ seller: sellerId });

        res.status(200).json({
            reviews,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
};

// Get pending reviews for the current buyer
const getPendingReviews = async (req, res) => {
    try {
        const buyerId = req.userData.userId;

        // Find completed orders that haven't been reviewed or skipped
        const pendingOrders = await Order.find({
            buyer: buyerId,
            fulfillmentStatus: { $in: ["delivered", "picked_up"] },
            isReviewed: false,
            reviewSkipped: false,
        })
            .populate("seller", "firstName lastName sellerRating")
            .populate("product", "name imageUrl")
            .sort({ updatedAt: -1 });

        res.status(200).json({ pendingOrders });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
};

// Skip review for an order
const skipReview = async (req, res) => {
    try {
        const { orderId } = req.body;
        const buyerId = req.userData.userId;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        // Verify buyer owns this order
        if (order.buyer.toString() !== buyerId) {
            return res.status(403).json({
                message: "You can only skip reviews for your own orders."
            });
        }

        // Mark review as skipped
        order.reviewSkipped = true;
        await order.save();

        res.status(200).json({ message: "Review skipped." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
};

// Get review for a specific order
const getReviewByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const buyerId = req.userData.userId;

        const review = await Review.findOne({ order: orderId })
            .populate("seller", "firstName lastName")
            .populate("product", "name imageUrl");

        if (!review) {
            return res.status(404).json({ message: "Review not found." });
        }

        // Verify the review belongs to the requesting user
        if (review.buyer.toString() !== buyerId) {
            return res.status(403).json({
                message: "You can only view your own reviews."
            });
        }

        res.status(200).json({ review });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
};

export default {
    createReview,
    getSellerReviews,
    getPendingReviews,
    skipReview,
    getReviewByOrder
};
