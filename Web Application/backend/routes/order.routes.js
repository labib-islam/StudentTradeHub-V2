import { Router } from "express";
import orderController from "../controllers/order.controller.js";
import checkAuth from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", checkAuth("user"), orderController.createOrder);
router.get("/", checkAuth(), orderController.getOrdersForUser);
router.get("/admin/all", checkAuth("admin"), orderController.getAllOrdersAdmin);
router.get("/admin/stats", checkAuth("admin"), orderController.getOrderStatistics);
router.get("/admin/user/:id", checkAuth("admin"), orderController.getOrdersForUserAdmin);
router.patch(
  "/:id/status/admin",
  checkAuth("admin"),
  orderController.updateOrderStatusAdmin
);
router.patch(
  "/:id/status",
  checkAuth("user"),
  orderController.updateOrderStatus
);
router.get("/:id", checkAuth(), orderController.getOrderById);

export default router;

