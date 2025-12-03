// user.controller.test.js
import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
} from "@jest/globals";

// ------- Mocks -------

const UserMock = {
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

const bcryptMock = {
  compare: jest.fn(),
  genSalt: jest.fn(),
  hash: jest.fn(),
};

// Register ESM mocks
jest.unstable_mockModule("../../models/user.model.js", () => ({
  default: UserMock,
}));

jest.unstable_mockModule("bcrypt", () => ({
  default: bcryptMock,
  ...bcryptMock,
}));

// Helper: mock res
const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Helper: for find().select().populate()
const makeFindChain = (result) => ({
  select: jest.fn().mockReturnThis(),
  populate: jest.fn().mockResolvedValue(result),
});

// Helper: for findById(...).select("+password")
const makeSelectChain = (result) => ({
  select: jest.fn().mockResolvedValue(result),
});

// Helper: for find().select().limit() in searchUsers
const makeSearchChain = (result) => ({
  select: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue(result),
});

let userController;

beforeAll(async () => {
  userController = (await import("../../controllers/user.controller.js")).default;
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------- getAllUsers ----------------

describe("userController.getAllUsers", () => {
  test("returns 200 and list of users", async () => {
    const req = {};
    const res = createRes();

    const users = [{ _id: "u1" }, { _id: "u2" }];

    UserMock.find.mockReturnValueOnce(makeFindChain(users));

    await userController.getAllUsers(req, res);

    expect(UserMock.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(users);
  });
});

// ---------------- getUserById ----------------

describe("userController.getUserById", () => {
  test("returns 404 if user not found", async () => {
    const req = { params: { id: "u1" } };
    const res = createRes();

    UserMock.findById.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(null),
    });

    await userController.getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found." });
  });

  test("returns 200 and user if found", async () => {
    const req = { params: { id: "u1" } };
    const res = createRes();

    const userDoc = { _id: "u1", firstName: "John" };

    UserMock.findById.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(userDoc),
    });

    await userController.getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(userDoc);
  });
});

// ---------------- updateUser ----------------

describe("userController.updateUser", () => {
  test("returns 403 if not same user", async () => {
    const req = {
      params: { id: "u1" },
      body: { firstName: "New" },
      userData: { userId: "otherUser" },
    };
    const res = createRes();

    await userController.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "You are not authorized to update this user.",
    });
  });

  test("returns 404 if user not found", async () => {
    const req = {
      params: { id: "u1" },
      body: {},
      userData: { userId: "u1" },
    };
    const res = createRes();

    UserMock.findById.mockReturnValueOnce(
      makeSelectChain(null) // .select("+password") -> null
    );

    await userController.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "User not found.",
    });
  });

  test("returns 400 if email already in use", async () => {
    const req = {
      params: { id: "u1" },
      body: { email: "new@example.com" },
      userData: { userId: "u1" },
    };
    const res = createRes();

    const userDoc = { _id: "u1", password: "hashed" };

    UserMock.findById.mockReturnValueOnce(makeSelectChain(userDoc));
    UserMock.findOne.mockResolvedValueOnce({ _id: "u2" });

    await userController.updateUser(req, res);

    expect(UserMock.findOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Email is already in use by another account.",
    });
  });

  test("returns 400 when changing password without currentPassword", async () => {
    const req = {
      params: { id: "u1" },
      body: { password: "newpass" },
      userData: { userId: "u1" },
    };
    const res = createRes();

    const userDoc = { _id: "u1", password: "old-hash" };
    UserMock.findById.mockReturnValueOnce(makeSelectChain(userDoc));

    await userController.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Current password is required to change password.",
    });
  });

  test("returns 401 when current password is wrong", async () => {
    const req = {
      params: { id: "u1" },
      body: {
        password: "newpass",
        currentPassword: "wrong",
      },
      userData: { userId: "u1" },
    };
    const res = createRes();

    const userDoc = { _id: "u1", password: "old-hash" };
    UserMock.findById.mockReturnValueOnce(makeSelectChain(userDoc));
    bcryptMock.compare.mockResolvedValueOnce(false);

    await userController.updateUser(req, res);

    expect(bcryptMock.compare).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Current password is incorrect.",
    });
  });

  test("updates user successfully (name + password)", async () => {
    const req = {
      params: { id: "u1" },
      body: {
        firstName: "NewName",
        password: "newpass",
        currentPassword: "oldpass",
      },
      userData: { userId: "u1" },
    };
    const res = createRes();

    const userDoc = { _id: "u1", password: "old-hash" };

    UserMock.findById.mockReturnValueOnce(makeSelectChain(userDoc));
    bcryptMock.compare.mockResolvedValueOnce(true);
    bcryptMock.genSalt.mockResolvedValueOnce("salt");
    bcryptMock.hash.mockResolvedValueOnce("new-hash");

    const updatedUser = {
      _id: "u1",
      firstName: "NewName",
      email: "test@example.com",
    };

    UserMock.findByIdAndUpdate.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(updatedUser),
    });

    await userController.updateUser(req, res);

    expect(UserMock.findByIdAndUpdate).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        firstName: "NewName",
        password: "new-hash",
      }),
      expect.objectContaining({
        new: true,
        runValidators: true,
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "User updated successfully.",
      user: updatedUser,
    });
  });
});

// ---------------- deleteUser ----------------

describe("userController.deleteUser", () => {
  test("returns 403 if not same user", async () => {
    const req = {
      params: { id: "u1" },
      userData: { userId: "other" },
    };
    const res = createRes();

    await userController.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "You are not authorized to delete this user.",
    });
  });

  test("returns 404 if user not found", async () => {
    const req = {
      params: { id: "u1" },
      userData: { userId: "u1" },
    };
    const res = createRes();

    UserMock.findByIdAndDelete.mockResolvedValueOnce(null);

    await userController.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "User not found.",
    });
  });

  test("deletes user successfully", async () => {
    const req = {
      params: { id: "u1" },
      userData: { userId: "u1" },
    };
    const res = createRes();

    UserMock.findByIdAndDelete.mockResolvedValueOnce({ _id: "u1" });

    await userController.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "User deleted successfully.",
    });
  });
});

// ---------------- searchUsers ----------------

describe("userController.searchUsers", () => {
  test("returns 400 if query is missing", async () => {
    const req = { query: {} };
    const res = createRes();

    await userController.searchUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Search query is required.",
    });
  });

  test("returns users for a valid query", async () => {
    const req = { query: { query: "john" } };
    const res = createRes();

    const users = [{ _id: "u1" }, { _id: "u2" }];

    UserMock.find.mockReturnValueOnce(makeSearchChain(users));

    await userController.searchUsers(req, res);

    expect(UserMock.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(users);
  });
});

// ---------------- addProductToUser ----------------

describe("userController.addProductToUser", () => {
  test("returns 403 if not same user", async () => {
    const req = {
      params: { id: "u1" },
      body: { productId: "p1" },
      userData: { userId: "other" },
    };
    const res = createRes();

    await userController.addProductToUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "You are not authorized to modify this user.",
    });
  });

  test("returns 404 if user not found", async () => {
    const req = {
      params: { id: "u1" },
      body: { productId: "p1" },
      userData: { userId: "u1" },
    };
    const res = createRes();

    UserMock.findById.mockResolvedValueOnce(null);

    await userController.addProductToUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "User not found.",
    });
  });

  test("returns 400 if product already in list", async () => {
    const req = {
      params: { id: "u1" },
      body: { productId: "p1" },
      userData: { userId: "u1" },
    };
    const res = createRes();

    const userDoc = {
      _id: "u1",
      productList: ["p1"],
    };

    UserMock.findById.mockResolvedValueOnce(userDoc);

    await userController.addProductToUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Product already in user's list.",
    });
  });

  test("adds product and returns updated user", async () => {
    const req = {
      params: { id: "u1" },
      body: { productId: "p2" },
      userData: { userId: "u1" },
    };
    const res = createRes();

    const userDoc = {
      _id: "u1",
      productList: ["p1"],
      save: jest.fn().mockResolvedValue(null),
    };

    const updatedUser = {
      _id: "u1",
      productList: ["p1", "p2"],
    };

    UserMock.findById
      .mockResolvedValueOnce(userDoc) // first: load user
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(updatedUser),
      }); // second: reload for response

    await userController.addProductToUser(req, res);

    expect(userDoc.productList).toContain("p2");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Product added to user successfully.",
      user: updatedUser,
    });
  });
});

// ---------------- removeProductFromUser ----------------

describe("userController.removeProductFromUser", () => {
  test("returns 403 if not same user", async () => {
    const req = {
      params: { id: "u1", productId: "p1" },
      userData: { userId: "other" },
    };
    const res = createRes();

    await userController.removeProductFromUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "You are not authorized to modify this user.",
    });
  });

  test("returns 404 if user not found", async () => {
    const req = {
      params: { id: "u1", productId: "p1" },
      userData: { userId: "u1" },
    };
    const res = createRes();

    UserMock.findById.mockResolvedValueOnce(null);

    await userController.removeProductFromUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "User not found.",
    });
  });

  test("removes product and returns updated user", async () => {
    const req = {
      params: { id: "u1", productId: "p2" },
      userData: { userId: "u1" },
    };
    const res = createRes();

    const userDoc = {
      _id: "u1",
      productList: ["p1", "p2", "p3"],
      save: jest.fn().mockResolvedValue(null),
    };

    const updatedUser = {
      _id: "u1",
      productList: ["p1", "p3"],
    };

    UserMock.findById
      .mockResolvedValueOnce(userDoc) // first load
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(updatedUser),
      }); // second load

    await userController.removeProductFromUser(req, res);

    expect(userDoc.productList).toEqual(["p1", "p3"]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Product removed from user successfully.",
      user: updatedUser,
    });
  });
});

// ---------------- addPaymentMethod ----------------

describe("userController.addPaymentMethod", () => {
  test("returns 404 if user not found", async () => {
    const req = {
      userData: { userId: "u1" },
      body: {
        cardHolderName: "John",
        cardNumber: "4111111111111111",
        expiryDate: "12/30",
        type: "visa",
      },
    };
    const res = createRes();

    UserMock.findById.mockResolvedValueOnce(null);

    await userController.addPaymentMethod(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "User not found.",
    });
  });

  test("adds payment method and default snapshot", async () => {
    const req = {
      userData: { userId: "u1" },
      body: {
        cardHolderName: "John",
        cardNumber: "4111111111111111",
        expiryDate: "12/30",
        type: "visa",
      },
    };
    const res = createRes();

    const userDoc = {
      _id: "u1",
      paymentMethod: null,
      defaultPaymentMethod: null,
      save: jest.fn().mockResolvedValue(null),
    };

    UserMock.findById.mockResolvedValueOnce(userDoc);

    await userController.addPaymentMethod(req, res);

    expect(userDoc.paymentMethod).toEqual(req.body);
    expect(userDoc.defaultPaymentMethod).toMatchObject({
      cardHolderName: "John",
      last4: "1111",
      expiryDate: "12/30",
      type: "visa",
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Payment method added",
      data: userDoc.defaultPaymentMethod,
    });
  });
});

// ---------------- getUserPreferences ----------------

describe("userController.getUserPreferences", () => {
  test("returns 404 if user not found", async () => {
    const req = { userData: { userId: "u1" } };
    const res = createRes();

    UserMock.findById.mockResolvedValueOnce(null);

    await userController.getUserPreferences(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "User not found.",
    });
  });

  test("returns preferences if user exists", async () => {
    const req = { userData: { userId: "u1" } };
    const res = createRes();

    const userDoc = {
      defaultPaymentMethod: { last4: "1111" },
      defaultDeliveryAddress: { line1: "addr" },
      pickupAddress: { line1: "pickup" },
    };

    UserMock.findById.mockResolvedValueOnce(userDoc);

    await userController.getUserPreferences(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      paymentMethod: userDoc.defaultPaymentMethod,
      deliveryAddress: userDoc.defaultDeliveryAddress,
      pickupAddress: userDoc.pickupAddress,
    });
  });
});

// ---------------- updateUserPreferences ----------------

describe("userController.updateUserPreferences", () => {
  test("returns 404 if user not found", async () => {
    const req = { userData: { userId: "u1" }, body: {} };
    const res = createRes();

    UserMock.findById.mockResolvedValueOnce(null);

    await userController.updateUserPreferences(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "User not found.",
    });
  });

  test("returns 400 if paymentMethod is invalid", async () => {
    const req = {
      userData: { userId: "u1" },
      body: {
        paymentMethod: {
          // missing some fields -> buildSafePaymentSnapshot will return null
          cardNumber: "4111111111111111",
        },
      },
    };
    const res = createRes();

    const userDoc = {
      _id: "u1",
      save: jest.fn().mockResolvedValue(null),
    };

    UserMock.findById.mockResolvedValueOnce(userDoc);

    await userController.updateUserPreferences(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid payment method data.",
    });
  });

  test("updates preferences successfully", async () => {
    const req = {
      userData: { userId: "u1" },
      body: {
        paymentMethod: {
          cardHolderName: "John",
          cardNumber: "4111111111111111",
          expiryDate: "12/30",
          type: "visa",
        },
        deliveryAddress: { line1: "addr" },
        pickupAddress: { line1: "pickup" },
      },
    };
    const res = createRes();

    const userDoc = {
      _id: "u1",
      defaultPaymentMethod: null,
      defaultDeliveryAddress: null,
      pickupAddress: null,
      save: jest.fn().mockResolvedValue(null),
    };

    UserMock.findById.mockResolvedValueOnce(userDoc);

    await userController.updateUserPreferences(req, res);

    expect(userDoc.defaultPaymentMethod).toMatchObject({
      last4: "1111",
      cardHolderName: "John",
      expiryDate: "12/30",
      type: "visa",
    });
    expect(userDoc.defaultDeliveryAddress).toEqual({ line1: "addr" });
    expect(userDoc.pickupAddress).toEqual({ line1: "pickup" });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Preferences updated successfully.",
      preferences: {
        paymentMethod: userDoc.defaultPaymentMethod,
        deliveryAddress: userDoc.defaultDeliveryAddress,
        pickupAddress: userDoc.pickupAddress,
      },
    });
  });

  test("updates only delivery address when provided", async () => {
    const req = {
      userData: { userId: "u1" },
      body: {
        deliveryAddress: { line1: "new address" },
      },
    };
    const res = createRes();

    const userDoc = {
      _id: "u1",
      defaultPaymentMethod: { last4: "1234" },
      defaultDeliveryAddress: { line1: "old address" },
      pickupAddress: null,
      save: jest.fn().mockResolvedValue(null),
    };

    UserMock.findById.mockResolvedValueOnce(userDoc);

    await userController.updateUserPreferences(req, res);

    expect(userDoc.defaultDeliveryAddress).toEqual({ line1: "new address" });
    expect(userDoc.defaultPaymentMethod).toEqual({ last4: "1234" }); // unchanged
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ---------------- getUserActivitySummary ----------------

const OrderMock = {
  countDocuments: jest.fn(),
};

const ProductMock = {
  updateMany: jest.fn(),
};

jest.unstable_mockModule("../../models/order.model.js", () => ({
  default: OrderMock,
}));

jest.unstable_mockModule("../../models/product.model.js", () => ({
  default: ProductMock,
}));

describe("userController.getUserActivitySummary", () => {
  test("returns 404 if user not found", async () => {
    const req = { params: { id: "u1" } };
    const res = createRes();

    UserMock.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(null),
    });

    await userController.getUserActivitySummary(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "User not found.",
    });
  });

  test("returns activity summary", async () => {
    const req = { params: { id: "u1" } };
    const res = createRes();

    const userDoc = {
      _id: "u1",
      productList: ["p1", "p2", "p3"],
    };

    UserMock.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(userDoc),
    });

    OrderMock.countDocuments
      .mockResolvedValueOnce(5) // bought
      .mockResolvedValueOnce(10); // sold

    await userController.getUserActivitySummary(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      productCount: 3,
      boughtCount: 5,
      soldCount: 10,
    });
  });

  test("handles user with no activity", async () => {
    const req = { params: { id: "u1" } };
    const res = createRes();

    const userDoc = {
      _id: "u1",
      productList: [],
    };

    UserMock.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(userDoc),
    });

    OrderMock.countDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    await userController.getUserActivitySummary(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      productCount: 0,
      boughtCount: 0,
      soldCount: 0,
    });
  });
});

// ---------------- updateUserStatus ----------------

describe("userController.updateUserStatus", () => {
  test("returns 400 if status is invalid", async () => {
    const req = {
      params: { id: "u1" },
      body: { status: "invalid" },
    };
    const res = createRes();

    await userController.updateUserStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid status. Must be 'active' or 'blocked'.",
    });
  });

  test("returns 404 if user not found", async () => {
    const req = {
      params: { id: "u1" },
      body: { status: "blocked" },
    };
    const res = createRes();

    UserMock.findByIdAndUpdate.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(null),
    });

    await userController.updateUserStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "User not found.",
    });
  });

  test("updates user status to blocked and sets products to inactive", async () => {
    const req = {
      params: { id: "u1" },
      body: { status: "blocked" },
    };
    const res = createRes();

    const userDoc = {
      _id: "u1",
      status: "active",
    };

    UserMock.findByIdAndUpdate.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(userDoc),
    });

    ProductMock.updateMany.mockResolvedValueOnce({ modifiedCount: 3 });

    await userController.updateUserStatus(req, res);

    expect(ProductMock.updateMany).toHaveBeenCalledWith(
      { createdBy: "u1", status: { $ne: "inactive" } },
      { status: "inactive" }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "User status updated successfully.",
      user: userDoc,
    });
  });

  test("updates user status to active without updating products", async () => {
    const req = {
      params: { id: "u1" },
      body: { status: "active" },
    };
    const res = createRes();

    const userDoc = {
      _id: "u1",
      status: "blocked",
    };

    UserMock.findByIdAndUpdate.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(userDoc),
    });

    await userController.updateUserStatus(req, res);

    expect(ProductMock.updateMany).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "User status updated successfully.",
      user: userDoc,
    });
  });
});

// ---------------- updateUser - additional edge cases ----------------

describe("userController.updateUser - additional edge cases", () => {
  test("updates only email when provided", async () => {
    const req = {
      params: { id: "u1" },
      body: { email: "newemail@example.com" },
      userData: { userId: "u1" },
    };
    const res = createRes();

    const userDoc = { _id: "u1", password: "hashed" };
    UserMock.findById.mockReturnValueOnce(makeSelectChain(userDoc));
    UserMock.findOne.mockResolvedValueOnce(null); // email not taken

    const updatedUser = {
      _id: "u1",
      email: "newemail@example.com",
    };

    UserMock.findByIdAndUpdate.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(updatedUser),
    });

    await userController.updateUser(req, res);

    expect(UserMock.findByIdAndUpdate).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        email: "newemail@example.com",
      }),
      expect.any(Object)
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("updates only firstName when provided", async () => {
    const req = {
      params: { id: "u1" },
      body: { firstName: "NewFirstName" },
      userData: { userId: "u1" },
    };
    const res = createRes();

    const userDoc = { _id: "u1", password: "hashed" };
    UserMock.findById.mockReturnValueOnce(makeSelectChain(userDoc));

    const updatedUser = {
      _id: "u1",
      firstName: "NewFirstName",
    };

    UserMock.findByIdAndUpdate.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(updatedUser),
    });

    await userController.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
