/**
 * Full end-to-end test using mongodb-memory-server.
 * Workflow:
 * 1. Signup
 * 2. Mock email verification
 * 3. Login
 * 4. Create a product
 * 5. Try to place an order on own listing (should fail with 400)
 */

import { jest } from "@jest/globals";
import request from "supertest";
import {
  connectTestDB,
  closeTestDB,
  clearDatabase,
} from "../setupTestDB.js";
import User from "../../models/user.model.js";

// IMPORTANT: this email must satisfy your User schema's regex for `email`
const TEST_EMAIL = "john@mun.ca"; // change this if your schema requires a different domain

// Mock email sender BEFORE importing app/controllers.
// This prevents real SMTP calls in tests.
jest.unstable_mockModule("../../utils/email.util.js", () => ({
  sendVerificationEmail: jest.fn(async () => ({ success: true })),
  sendPasswordResetEmail: jest.fn(async () => ({ success: true })),
}));

// Dynamically import the app AFTER mocks are registered.
const { default: app } = await import("../../app.js");

let token = "";
let createdProductId = "";

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

afterEach(async () => {
  await clearDatabase();
});

describe("Full E2E Workflow", () => {
  test("Signup → verify email → login → create product → cannot buy own listing(From the HTTP request → through the middleware → into the controller → through the database → and finally returning the response)", async () => {
    /** 1. SIGNUP */
    const signupRes = await request(app).post("/api/auth/signup").send({
      firstName: "John",
      lastName: "Doe",
      email: TEST_EMAIL,
      password: "password123",
    });

    // Log only when status is not what we expect
    if (signupRes.status !== 201) {
      console.log("Signup response status:", signupRes.status);
      console.log("Signup response body:", signupRes.body);
    }

    expect(signupRes.status).toBe(201);

    /** 2. BYPASS EMAIL VERIFICATION (since tests cannot receive emails) */
    const user = await User.findOne({ email: TEST_EMAIL });
    expect(user).not.toBeNull();

    user.isEmailVerified = true;
    await user.save();

    /** 3. LOGIN */
    const loginRes = await request(app).post("/api/auth/login").send({
      email: TEST_EMAIL,
      password: "password123",
    });

    if (loginRes.status !== 200) {
      console.log("Login response status:", loginRes.status);
      console.log("Login response body:", loginRes.body);
    }

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty("token");
    token = loginRes.body.token;

    /** 4. CREATE A PRODUCT (as the same user) */
    const createProductRes = await request(app)
      .post("/api/products/new") // matches router.post("/new", ...) under /api/products
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Test Product")
      .field("description", "A product for testing")
      .field("price", 10)
      .field("category", "General")
      .field("quantity", 5)
      .field("condition", "Good") // make sure this matches your Product schema enum
      // "image" must match fileUpload.single("image")
      .attach("image", Buffer.from("fake-image-content"), "test.jpg");

    if (createProductRes.status !== 201) {
      console.log("Create product status:", createProductRes.status);
      console.log("Create product body:", createProductRes.body);
    }

    // Expect successful creation
    expect(createProductRes.status).toBe(201);
    expect(createProductRes.body).toHaveProperty("product");
    expect(createProductRes.body.product).toHaveProperty("_id");

    createdProductId = createProductRes.body.product._id;

    /** 5. PLACE AN ORDER ON OWN LISTING (should fail with 400) */
    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId: createdProductId,
        quantity: 1,
        paymentMethod: {
          cardHolderName: "John Doe",
          cardNumber: "1234567890123456",
          expiryDate: "12/30",
          type: "visa",
        },
        deliveryOption: {
          type: "pickup",
        },
      });

    // We expect 400 here because user is trying to buy their own listing
    if (orderRes.status !== 400) {
      console.log("Order response status:", orderRes.status);
      console.log("Order response body:", orderRes.body);
    }

    expect(orderRes.status).toBe(400);
    expect(orderRes.body).toHaveProperty("message");
    expect(orderRes.body.message).toBe("You cannot purchase your own listing.");
  });
});
