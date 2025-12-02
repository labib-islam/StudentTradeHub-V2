import { Router } from "express";
import userController from "../controllers/user.controller.js";
import checkAuth from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.get("/search", userController.searchUsers);

// Protected routes - require authentication
router.get("/", checkAuth("admin"), userController.getAllUsers);
router.get("/:id/activity", checkAuth("admin"), userController.getUserActivitySummary);
router.patch("/:id/status", checkAuth("admin"), userController.updateUserStatus);
router.get("/:id", checkAuth(), userController.getUserById);
router.put("/:id", checkAuth(), userController.updateUser);
router.delete("/:id", checkAuth(), userController.deleteUser);

// Product management routes
router.post("/:id/products", checkAuth(), userController.addProductToUser);
router.delete(
  "/:id/products/:productId",
  checkAuth(),
  userController.removeProductFromUser
);

router.post("/payment/add", checkAuth("user"), userController.addPaymentMethod);
router.get("/me/preferences", checkAuth(), userController.getUserPreferences);
router.patch(
  "/me/preferences",
  checkAuth("user"),
  userController.updateUserPreferences
);

export default router;
