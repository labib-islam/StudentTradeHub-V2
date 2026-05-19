// backend/acceptance/app.e2e.test.js
import request from "supertest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import app from "../../app.js";

// Fix missing __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("App Acceptance (E2E) Tests", () => {

  test("GET / should return 200 and respond with 'Student-Tradehub'", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.text).toBe("Student-Tradehub");
  });

  test("Unknown paths should return 404 with a JSON error message", async () => {
    const res = await request(app).get("/some/path/that/does/not/exist");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("The requested path was not found.");
  });

  test("Requests with Origin http://localhost:3000 should include CORS headers", async () => {
    const res = await request(app)
      .get("/")
      .set("Origin", "http://localhost:3000");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000"
    );
  });

  // Static files route removed; no test for /public/images
});
