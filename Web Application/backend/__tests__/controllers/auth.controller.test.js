// auth.controller.test.js
import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
} from "@jest/globals";

// --- Mock helpers ---

// Mock for User model (constructor + static methods)
const UserMock = function (doc) {
  Object.assign(this, doc);
};
UserMock.prototype.save = jest.fn();

UserMock.findOne = jest.fn();
UserMock.findById = jest.fn();
UserMock.findByIdAndDelete = jest.fn();

// Mocks for external libs
const bcryptMock = {
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
};

const jwtMock = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const emailUtilMock = {
  sendPasswordResetEmail: jest.fn(),
  sendVerificationEmail: jest.fn(),
};

// Tell Jest to mock these modules (ESM style)
jest.unstable_mockModule("../../models/user.model.js", () => ({
  default: UserMock,
}));

jest.unstable_mockModule("bcrypt", () => ({
  default: bcryptMock,
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: jwtMock,
}));

jest.unstable_mockModule("../../utils/email.util.js", () => ({
  sendPasswordResetEmail: emailUtilMock.sendPasswordResetEmail,
  sendVerificationEmail: emailUtilMock.sendVerificationEmail,
}));

// Helper to create a fake res object
const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

let authController;

beforeAll(async () => {
  // Import the real controller AFTER mocks are set up
  authController = (await import("../../controllers/auth.controller.js")).default;
});

beforeEach(() => {
  jest.clearAllMocks();
  UserMock.prototype.save.mockReset();
});

// ---------------------- signup ----------------------

describe("authController.signup", () => {
  test("returns 400 if required fields are missing", async () => {
    const req = {
      body: {
        email: "test@example.com",
        password: "12345678",
        // firstName & lastName missing
      },
    };
    const res = createRes();

    await authController.signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Please enter all required fields.",
    });
  });

  test("returns 400 if email already exists", async () => {
    const req = {
      body: {
        firstName: "John",
        lastName: "Doe",
        email: "test@example.com",
        password: "12345678",
      },
    };
    const res = createRes();

    UserMock.findOne.mockResolvedValueOnce({ _id: "existingUserId" });

    await authController.signup(req, res);

    expect(UserMock.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "An account with this email exists.",
    });
  });

  test("creates user and sends verification email on success", async () => {
    const req = {
      body: {
        firstName: "John",
        lastName: "Doe",
        email: "test@example.com",
        password: "12345678",
      },
    };
    const res = createRes();

    UserMock.findOne.mockResolvedValueOnce(null);
    bcryptMock.genSalt.mockResolvedValueOnce("salt");
    bcryptMock.hash.mockResolvedValueOnce("hashedPassword");

    const savedUser = { _id: "newUserId" };
    UserMock.prototype.save.mockResolvedValueOnce(savedUser);

    emailUtilMock.sendVerificationEmail.mockResolvedValueOnce({
      success: true,
    });

    await authController.signup(req, res);

    expect(UserMock.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(bcryptMock.genSalt).toHaveBeenCalled();
    expect(bcryptMock.hash).toHaveBeenCalledWith("12345678", "salt");
    expect(UserMock.prototype.save).toHaveBeenCalled();
    expect(emailUtilMock.sendVerificationEmail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Account created successfully! Please check your email to verify your account before logging in.",
        email: "test@example.com",
      })
    );
  });

  test("deletes user and returns 500 if verification email fails", async () => {
    const req = {
      body: {
        firstName: "John",
        lastName: "Doe",
        email: "test@example.com",
        password: "12345678",
      },
    };
    const res = createRes();

    UserMock.findOne.mockResolvedValueOnce(null);
    bcryptMock.genSalt.mockResolvedValueOnce("salt");
    bcryptMock.hash.mockResolvedValueOnce("hashedPassword");

    const savedUser = { _id: "newUserId" };
    UserMock.prototype.save.mockResolvedValueOnce(savedUser);

    emailUtilMock.sendVerificationEmail.mockResolvedValueOnce({
      success: false,
    });

    // We need to mock findByIdAndDelete as well
    UserMock.findByIdAndDelete = jest.fn().mockResolvedValueOnce(null);

    await authController.signup(req, res);

    expect(UserMock.findByIdAndDelete).toHaveBeenCalledWith("newUserId");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Error sending verification email. Please try again later.",
    });
  });
});

// ---------------------- login ----------------------

describe("authController.login", () => {
  test("returns 400 if email or password is missing", async () => {
    const req = { body: { email: "", password: "" } };
    const res = createRes();

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Please enter all required fields.",
    });
  });

  test("returns 401 if user does not exist", async () => {
    const req = {
      body: { email: "test@example.com", password: "12345678" },
    };
    const res = createRes();

    UserMock.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(null),
    });

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Wrong email or password",
    });
  });

  test("returns 403 if email is not verified", async () => {
    const user = {
      email: "test@example.com",
      password: "hashed",
      isEmailVerified: false,
    };

    UserMock.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(user),
    });

    const req = {
      body: { email: "test@example.com", password: "12345678" },
    };
    const res = createRes();

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "Please verify your email before logging in. Check your inbox for the verification link.",
    });
  });

  test("returns 401 if password is incorrect", async () => {
    const user = {
      email: "test@example.com",
      password: "hashed",
      isEmailVerified: true,
    };

    UserMock.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(user),
    });

    bcryptMock.compare.mockResolvedValueOnce(false);

    const req = {
      body: { email: "test@example.com", password: "wrong" },
    };
    const res = createRes();

    await authController.login(req, res);

    expect(bcryptMock.compare).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Wrong email or password",
    });
  });

  test("returns token on successful login", async () => {
    const user = {
      _id: "userId",
      email: "test@example.com",
      password: "hashed",
      isEmailVerified: true,
    };

    UserMock.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(user),
    });

    bcryptMock.compare.mockResolvedValueOnce(true);
    jwtMock.sign.mockReturnValueOnce("fake-jwt-token");

    const req = {
      body: { email: "test@example.com", password: "12345678" },
    };
    const res = createRes();

    process.env.JWT_SECRET = "test-secret";

    await authController.login(req, res);

    expect(jwtMock.sign).toHaveBeenCalledWith(
      {
        userId: "userId",
        userEmail: "test@example.com",
      },
      "test-secret"
    );

    expect(res.json).toHaveBeenCalledWith({
      token: "fake-jwt-token",
    });
  });
});

// ---------------------- logout ----------------------

describe("authController.logout", () => {
  test("just sends 'logout'", async () => {
    const req = {};
    const res = createRes();

    await authController.logout(req, res);

    expect(res.send).toHaveBeenCalledWith("logout");
  });
});

// ---------------------- getCurrentUser ----------------------

describe("authController.getCurrentUser", () => {
  test("returns 401 if no token is provided", async () => {
    const req = { headers: {} };
    const res = createRes();

    await authController.getCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "No token provided",
    });
  });

  test("returns 401 if token is invalid", async () => {
    const req = {
      headers: { authorization: "Bearer invalidtoken" },
    };
    const res = createRes();

    jwtMock.verify.mockImplementation(() => {
      throw new Error("invalid");
    });

    process.env.JWT_SECRET = "test-secret";

    await authController.getCurrentUser(req, res);

    expect(jwtMock.verify).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid token",
    });
  });

  test("returns user on valid token", async () => {
    const req = {
      headers: { authorization: "Bearer validtoken" },
    };
    const res = createRes();

    jwtMock.verify.mockReturnValueOnce({
      userEmail: "test@example.com",
    });

    const user = { _id: "userId", email: "test@example.com" };

    UserMock.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(user),
    });

    process.env.JWT_SECRET = "test-secret";

    await authController.getCurrentUser(req, res);

    expect(UserMock.findOne).toHaveBeenCalledWith({
      email: "test@example.com",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(user);
  });
});

// ---------------------- forgotPassword ----------------------

describe("authController.forgotPassword", () => {
  test("returns 400 if email is missing", async () => {
    const req = { body: {} };
    const res = createRes();

    await authController.forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Please provide an email address.",
    });
  });

  test("returns 200 even if user does not exist", async () => {
    const req = { body: { email: "noone@example.com" } };
    const res = createRes();

    UserMock.findOne.mockResolvedValueOnce(null);

    await authController.forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  });

  test("sends reset email when user exists", async () => {
    const user = {
      email: "test@example.com",
      save: jest.fn().mockResolvedValue(null),
    };

    // Forgot password uses findOne without select
    UserMock.findOne.mockResolvedValueOnce(user);
    emailUtilMock.sendPasswordResetEmail.mockResolvedValueOnce({
      success: true,
    });

    const req = { body: { email: "test@example.com" } };
    const res = createRes();

    await authController.forgotPassword(req, res);

    expect(user.save).toHaveBeenCalled();
    expect(emailUtilMock.sendPasswordResetEmail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  });

  test("returns 500 if email sending fails", async () => {
    const user = {
      email: "test@example.com",
      save: jest.fn().mockResolvedValue(null),
    };

    UserMock.findOne.mockResolvedValueOnce(user);
    emailUtilMock.sendPasswordResetEmail.mockResolvedValueOnce({
      success: false,
    });

    const req = { body: { email: "test@example.com" } };
    const res = createRes();

    await authController.forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Error sending email. Please try again later.",
    });
  });
});

// ---------------------- resetPassword ----------------------

describe("authController.resetPassword", () => {
  test("returns 400 if token or newPassword is missing", async () => {
    const req = { body: { token: "", newPassword: "" } };
    const res = createRes();

    await authController.resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Please provide a token and new password.",
    });
  });

  test("returns 400 if newPassword is too short", async () => {
    const req = { body: { token: "abc", newPassword: "short" } };
    const res = createRes();

    await authController.resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Password must be at least 8 characters long.",
    });
  });

  test("returns 400 if token is invalid or expired", async () => {
    const req = { body: { token: "abc", newPassword: "12345678" } };
    const res = createRes();

    // resetPassword uses findOne().select(...)
    UserMock.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(null),
    });

    await authController.resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired password reset token.",
    });
  });

  test("resets password successfully with valid token", async () => {
    const user = {
      password: "old",
      resetPasswordToken: "hash",
      resetPasswordExpires: Date.now() + 10000,
      save: jest.fn().mockResolvedValue(null),
    };

    UserMock.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(user),
    });

    bcryptMock.genSalt.mockResolvedValueOnce("salt");
    bcryptMock.hash.mockResolvedValueOnce("newHashed");

    const req = { body: { token: "abc", newPassword: "12345678" } };
    const res = createRes();

    await authController.resetPassword(req, res);

    expect(user.password).toBe("newHashed");
    expect(user.resetPasswordToken).toBeUndefined();
    expect(user.resetPasswordExpires).toBeUndefined();
    expect(user.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "Password has been reset successfully. You can now log in with your new password.",
    });
  });
});

// ---------------------- verifyEmail ----------------------

describe("authController.verifyEmail", () => {
  test("returns 400 if token is missing", async () => {
    const req = { body: {} };
    const res = createRes();

    await authController.verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Verification token is required.",
    });
  });

  test("returns 400 if token is invalid or expired", async () => {
    const req = { body: { token: "abc" } };
    const res = createRes();

    UserMock.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(null),
    });

    await authController.verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired verification token.",
    });
  });

  test("verifies email successfully with valid token", async () => {
    const user = {
      isEmailVerified: false,
      emailVerificationToken: "hash",
      emailVerificationExpires: Date.now() + 10000,
      save: jest.fn().mockResolvedValue(null),
    };

    UserMock.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(user),
    });

    const req = { body: { token: "abc" } };
    const res = createRes();

    await authController.verifyEmail(req, res);

    expect(user.isEmailVerified).toBe(true);
    expect(user.emailVerificationToken).toBeUndefined();
    expect(user.emailVerificationExpires).toBeUndefined();
    expect(user.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "Email verified successfully! You can now log in to your account.",
    });
  });
});
