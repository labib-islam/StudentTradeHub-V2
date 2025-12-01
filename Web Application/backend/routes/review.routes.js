import { Router } from "express";
import reviewController from "../controllers/review.controller.js";
import checkAuth from "../middlewares/auth.middleware.js";

const router = Router();

// Create a review (requires authentication)
router.post("/", checkAuth(), reviewController.createReview);

// Get reviews for a seller (public)
router.get("/seller/:sellerId", reviewController.getSellerReviews);

// Get pending reviews for current buyer (requires authentication)
router.get("/pending", checkAuth(), reviewController.getPendingReviews);

// Get review for a specific order (requires authentication)
router.get("/order/:orderId", checkAuth(), reviewController.getReviewByOrder);

// Skip a review (requires authentication)
router.post("/skip", checkAuth(), reviewController.skipReview);

export default router;
