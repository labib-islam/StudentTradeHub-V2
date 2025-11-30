import { Router } from "express";
import orderController from "../controllers/order.controller.js";
import checkAuth from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", checkAuth("user"), orderController.createOrder);
router.get("/", checkAuth(), orderController.getOrdersForUser);
router.get("/:id", checkAuth(), orderController.getOrderById);
router.patch(
  "/:id/status",
  checkAuth("user"),
  orderController.updateOrderStatus
);

export default router;

