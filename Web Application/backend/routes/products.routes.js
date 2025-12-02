import { Router } from "express";
import fileUpload from "../middlewares/fileUpload.middleware.js";

import productController from "../controllers/product.controller.js";
import checkAuth from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", checkAuth(), productController.getAllProducts);
router.get("/suggest", productController.suggestProducts);
router.get("/:pid", checkAuth(), productController.getProductById);
router.post(
  "/new",
  checkAuth("user"),
  fileUpload.single("image"),
  productController.createProduct
);
router.patch("/:pid", checkAuth("user"), productController.updateProduct);
router.delete("/:pid", checkAuth("user"), productController.deleteProduct);

export default router;
