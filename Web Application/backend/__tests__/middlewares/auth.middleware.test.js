// auth.middleware.test.js
import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
} from "@jest/globals";

// --- mock jsonwebtoken ---
const verifyMock = jest.fn();

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: { verify: verifyMock },
  verify: verifyMock,
}));

// --- mock User model ---
const mockUserFindById = jest.fn();
const mockUserModel = {
  findById: mockUserFindById,
};

jest.unstable_mockModule("../../models/user.model.js", () => ({
  default: mockUserModel,
}));

let checkAuth;

beforeAll(async () => {
  // import after mocks
  checkAuth = (await import("../../middlewares/auth.middleware.js")).default;
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = "test-secret";

  // Default mock for User.findById
  mockUserFindById.mockReturnValue({
    select: jest.fn().mockResolvedValue({
      _id: "user123",
      status: "active",
      role: "user",
    }),
  });
});

// helper: mock res / next
const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("checkAuth middleware", () => {
  test("returns 401 if Authorization header is missing", () => {
    const req = { headers: {} };
    const res = createRes();
    const next = jest.fn();

    const middleware = checkAuth();
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication failed",
    });
    expect(next).not.toHaveBeenCalled();
    expect(verifyMock).not.toHaveBeenCalled();
  });

  test("returns 401 if header is not Bearer token", () => {
    const req = { headers: { authorization: "Token abc" } };
    const res = createRes();
    const next = jest.fn();

    const middleware = checkAuth();
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication failed",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 if token is invalid", () => {
    const req = { headers: { authorization: "Bearer badtoken" } };
    const res = createRes();
    const next = jest.fn();

    verifyMock.mockImplementation(() => {
      throw new Error("invalid");
    });

    const middleware = checkAuth();
    middleware(req, res, next);

    expect(verifyMock).toHaveBeenCalledWith("badtoken", "test-secret");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("sets req.userData and calls next on valid token", async () => {
    const req = { headers: { authorization: "Bearer goodtoken" } };
    const res = createRes();
    const next = jest.fn();

    verifyMock.mockReturnValueOnce({
      userId: "user123",
      role: "user",
    });

    const middleware = checkAuth();
    await middleware(req, res, next);

    expect(verifyMock).toHaveBeenCalledWith("goodtoken", "test-secret");
    expect(req.userData).toEqual({
      userId: "user123",
      role: "user",
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
