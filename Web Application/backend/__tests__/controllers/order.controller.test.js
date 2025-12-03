// order.controller.test.js
import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
} from "@jest/globals";

// ---- Mocks ----

// Simple mock objects for models
const OrderMock = {
  create: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
};

const ProductMock = {
  findById: jest.fn(),
};

const UserMock = {
  findById: jest.fn(),
};

// Mock for mongoose session
const sessionMock = {
  withTransaction: jest.fn(),
  endSession: jest.fn(),
};

const mongooseMock = {
  startSession: jest.fn(),
};

// Register ESM mocks
jest.unstable_mockModule("mongoose", () => ({
  default: mongooseMock,
  ...mongooseMock,
}));

jest.unstable_mockModule("../../models/order.model.js", () => ({
  default: OrderMock,
}));

jest.unstable_mockModule("../../models/product.model.js", () => ({
  default: ProductMock,
}));

jest.unstable_mockModule("../../models/user.model.js", () => ({
  default: UserMock,
}));

// Helper: fake Express res
const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Helper: create a thenable query for Order.find / findById chains
const makeOrderQuery = (result) => {
  return {
    sort: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    then: (resolve) => resolve(result),
  };
};

let orderController;

beforeAll(async () => {
  // session.withTransaction should execute callback
  sessionMock.withTransaction.mockImplementation(async (fn) => {
    await fn();
  });

  mongooseMock.startSession.mockResolvedValue(sessionMock);

  // Import controller after mocks are ready
  orderController = (await import("../../controllers/order.controller.js")).default;
});

beforeEach(() => {
  jest.clearAllMocks();
});

// --------------------- createOrder ---------------------

describe("orderController.createOrder", () => {
  test("returns 400 if productId is missing", async () => {
    const req = {
      userData: { userId: "buyerId" },
      body: {
        // productId missing
        quantity: 1,
      },
    };
    const res = createRes();

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Product is required.",
    });
  });

  test("returns 400 if quantity is invalid", async () => {
    const req = {
      userData: { userId: "buyerId" },
      body: {
        productId: "prod1",
        quantity: 0, // invalid
      },
    };
    const res = createRes();

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Valid quantity is required.",
    });
  });

  test("returns 404 if buyer is not found", async () => {
    const req = {
      userData: { userId: "buyerId" },
      body: {
        productId: "prod1",
        quantity: 1,
      },
    };
    const res = createRes();

    // 1st User.findById -> buyer
    UserMock.findById.mockReturnValueOnce({
      session: jest.fn().mockResolvedValue(null),
    });

    await orderController.createOrder(req, res);

    expect(UserMock.findById).toHaveBeenCalledWith("buyerId");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Buyer account not found.",
    });
  });

  test("creates order successfully (delivery)", async () => {
    const req = {
      userData: { userId: "buyerId" },
      body: {
        productId: "prod1",
        quantity: 2,
        paymentMethod: {
          cardHolderName: "John Doe",
          cardNumber: "4111111111111111",
          expiryDate: "12/30",
          type: "visa",
        },
        deliveryOption: {
          type: "deliver",
          address: { line1: "123 Street" },
        },
        savePaymentMethod: true,
        saveDeliveryAddress: true,
      },
    };
    const res = createRes();

    // Buyer document
    const buyerDoc = {
      _id: "buyerId",
      defaultPaymentMethod: null,
      defaultDeliveryAddress: null,
      paymentMethod: null,
      save: jest.fn().mockResolvedValue(null),
    };

    // Product document
    const productDoc = {
      _id: "prod1",
      price: 10,
      quantity: 5,
      status: "active",
      createdBy: { _id: "sellerId" },
      save: jest.fn().mockResolvedValue(null),
    };

    // Seller document
    const sellerDoc = {
      _id: "sellerId",
      pickupAddress: null,
      defaultDeliveryAddress: { line1: "seller addr" },
    };

    // Order created
    const createdOrder = [{ _id: "order1" }];

    // Mock User.findById for buyer (first call)
    UserMock.findById.mockReturnValueOnce({
      session: jest.fn().mockResolvedValue(buyerDoc),
    });

    // Mock Product.findById
    ProductMock.findById.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      session: jest.fn().mockResolvedValue(productDoc),
    });

    // Mock User.findById for seller (second call)
    UserMock.findById.mockReturnValueOnce({
      session: jest.fn().mockResolvedValue(sellerDoc),
    });

    // Mock Order.create
    OrderMock.create.mockResolvedValueOnce(createdOrder);

    await orderController.createOrder(req, res);

    // Product quantity should be reduced inside transaction
    expect(productDoc.quantity).toBe(3);
    expect(productDoc.save).toHaveBeenCalled();

    // Buyer preferences saved
    expect(buyerDoc.defaultPaymentMethod).toBeDefined();
    expect(buyerDoc.paymentMethod).toEqual(req.body.paymentMethod);
    expect(buyerDoc.defaultDeliveryAddress).toEqual({
      line1: "123 Street",
    });

    expect(OrderMock.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Order placed successfully.",
      order: createdOrder[0],
    });
    expect(sessionMock.endSession).toHaveBeenCalled();
  });
});

// --------------------- getOrderById ---------------------

describe("orderController.getOrderById", () => {
  test("returns 404 if order not found", async () => {
    const req = {
      params: { id: "order1" },
      userData: { userId: "buyerId" },
    };
    const res = createRes();

    OrderMock.findById.mockReturnValueOnce(
      makeOrderQuery(null) // resolves to null
    );

    await orderController.getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Order not found.",
    });
  });

  test("returns 403 if user is neither buyer nor seller", async () => {
    const req = {
      params: { id: "order1" },
      userData: { userId: "otherUser" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "order1",
      buyer: { _id: "buyerId" },
      seller: { _id: "sellerId" },
    };

    OrderMock.findById.mockReturnValueOnce(makeOrderQuery(orderDoc));

    await orderController.getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Access denied.",
    });
  });

  test("returns 200 if user is buyer", async () => {
    const req = {
      params: { id: "order1" },
      userData: { userId: "buyerId" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "order1",
      buyer: { _id: "buyerId" },
      seller: { _id: "sellerId" },
    };

    OrderMock.findById.mockReturnValueOnce(makeOrderQuery(orderDoc));

    await orderController.getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ order: orderDoc });
  });
});

// --------------------- getOrdersForUser ---------------------

describe("orderController.getOrdersForUser", () => {
  test("fetches orders as buyer by default", async () => {
    const req = {
      userData: { userId: "user1" },
      query: {}, // no role -> buyer
    };
    const res = createRes();

    const orders = [{ _id: "o1" }, { _id: "o2" }];

    OrderMock.find.mockReturnValueOnce(makeOrderQuery(orders));

    await orderController.getOrdersForUser(req, res);

    expect(OrderMock.find).toHaveBeenCalledWith({ buyer: "user1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ orders });
  });

  test("fetches orders as seller when role=seller", async () => {
    const req = {
      userData: { userId: "user1" },
      query: { role: "seller" },
    };
    const res = createRes();

    const orders = [{ _id: "o3" }];

    OrderMock.find.mockReturnValueOnce(makeOrderQuery(orders));

    await orderController.getOrdersForUser(req, res);

    expect(OrderMock.find).toHaveBeenCalledWith({ seller: "user1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ orders });
  });
});

// --------------------- updateOrderStatus ---------------------

describe("orderController.updateOrderStatus", () => {
  test("returns 400 if status is missing", async () => {
    const req = {
      userData: { userId: "sellerId" },
      params: { id: "order1" },
      body: {},
    };
    const res = createRes();

    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "New status is required to update order.",
    });
  });

  test("returns 404 if order not found", async () => {
    const req = {
      userData: { userId: "sellerId" },
      params: { id: "order1" },
      body: { status: "confirmed" },
    };
    const res = createRes();

    OrderMock.findById.mockReturnValueOnce(makeOrderQuery(null));

    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Order not found.",
    });
  });

  test("returns 403 if current user is not seller", async () => {
    const req = {
      userData: { userId: "otherUser" },
      params: { id: "order1" },
      body: { status: "confirmed" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "order1",
      seller: { _id: "sellerId" },
      buyer: { _id: "buyerId" },
      deliveryType: "deliver",
      fulfillmentStatus: "pending",
      save: jest.fn().mockResolvedValue(null),
    };

    OrderMock.findById.mockReturnValueOnce(makeOrderQuery(orderDoc));

    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Only the seller can update the order status.",
    });
  });

  test("returns 400 if cancelling and status is not pending", async () => {
    const req = {
      userData: { userId: "sellerId" },
      params: { id: "order1" },
      body: { status: "cancelled" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "order1",
      seller: { _id: "sellerId" },
      buyer: { _id: "buyerId" },
      deliveryType: "deliver",
      fulfillmentStatus: "confirmed", // not pending
      save: jest.fn().mockResolvedValue(null),
    };

    OrderMock.findById.mockReturnValueOnce(makeOrderQuery(orderDoc));

    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Order can only be cancelled when pending.",
    });
  });

  test("moves status forward in pipeline (pending -> confirmed)", async () => {
    const req = {
      userData: { userId: "sellerId" },
      params: { id: "order1" },
      body: { status: "confirmed" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "order1",
      seller: { _id: "sellerId" },
      buyer: { _id: "buyerId" },
      deliveryType: "deliver", // pipeline: pending, confirmed, out_for_delivery, delivered
      fulfillmentStatus: "pending",
      save: jest.fn().mockResolvedValue(null),
    };

    const updatedOrderDoc = {
      ...orderDoc,
      fulfillmentStatus: "confirmed",
    };

    // First call to findById - returns the order
    OrderMock.findById.mockReturnValueOnce(makeOrderQuery(orderDoc));
    // Second call to findById (after save) - returns the updated order
    OrderMock.findById.mockReturnValueOnce(makeOrderQuery(updatedOrderDoc));

    await orderController.updateOrderStatus(req, res);

    expect(orderDoc.fulfillmentStatus).toBe("confirmed");
    expect(orderDoc.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ order: updatedOrderDoc });
  });

  test("cancels order when status is pending", async () => {
    const req = {
      userData: { userId: "sellerId" },
      params: { id: "order1" },
      body: { status: "cancelled" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "order1",
      seller: { _id: "sellerId" },
      buyer: { _id: "buyerId" },
      deliveryType: "deliver",
      fulfillmentStatus: "pending",
      save: jest.fn().mockResolvedValue(null),
    };

    const updatedOrderDoc = {
      ...orderDoc,
      fulfillmentStatus: "cancelled",
    };

    OrderMock.findById.mockReturnValueOnce(makeOrderQuery(orderDoc));
    OrderMock.findById.mockReturnValueOnce(makeOrderQuery(updatedOrderDoc));

    await orderController.updateOrderStatus(req, res);

    expect(orderDoc.fulfillmentStatus).toBe("cancelled");
    expect(orderDoc.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ order: updatedOrderDoc });
  });

  test("returns 400 for invalid status", async () => {
    const req = {
      userData: { userId: "sellerId" },
      params: { id: "order1" },
      body: { status: "invalid_status" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "order1",
      seller: { _id: "sellerId" },
      buyer: { _id: "buyerId" },
      deliveryType: "deliver",
      fulfillmentStatus: "pending",
      save: jest.fn().mockResolvedValue(null),
    };

    OrderMock.findById.mockReturnValueOnce(makeOrderQuery(orderDoc));

    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid status for this order.",
    });
  });

  test("returns 400 when trying to move status backward", async () => {
    const req = {
      userData: { userId: "sellerId" },
      params: { id: "order1" },
      body: { status: "pending" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "order1",
      seller: { _id: "sellerId" },
      buyer: { _id: "buyerId" },
      deliveryType: "deliver",
      fulfillmentStatus: "confirmed",
      save: jest.fn().mockResolvedValue(null),
    };

    OrderMock.findById.mockReturnValueOnce(makeOrderQuery(orderDoc));

    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Status can only move forward in the delivery pipeline.",
    });
  });

  test("handles pickup delivery type with correct pipeline", async () => {
    const req = {
      userData: { userId: "sellerId" },
      params: { id: "order1" },
      body: { status: "ready_for_pickup" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "order1",
      seller: { _id: "sellerId" },
      buyer: { _id: "buyerId" },
      deliveryType: "pickup", // pipeline: pending, ready_for_pickup, picked_up
      fulfillmentStatus: "pending",
      save: jest.fn().mockResolvedValue(null),
    };

    const updatedOrderDoc = {
      ...orderDoc,
      fulfillmentStatus: "ready_for_pickup",
    };

    OrderMock.findById.mockReturnValueOnce(makeOrderQuery(orderDoc));
    OrderMock.findById.mockReturnValueOnce(makeOrderQuery(updatedOrderDoc));

    await orderController.updateOrderStatus(req, res);

    expect(orderDoc.fulfillmentStatus).toBe("ready_for_pickup");
    expect(orderDoc.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// --------------------- getOrdersForUserAdmin ---------------------

describe("orderController.getOrdersForUserAdmin", () => {
  test("fetches orders for user as buyer (admin)", async () => {
    const req = {
      params: { id: "user1" },
      query: { role: "buyer" },
    };
    const res = createRes();

    const orders = [{ _id: "o1" }, { _id: "o2" }];

    OrderMock.find.mockReturnValueOnce(makeOrderQuery(orders));

    await orderController.getOrdersForUserAdmin(req, res);

    expect(OrderMock.find).toHaveBeenCalledWith({ buyer: "user1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ orders });
  });

  test("fetches orders for user as seller (admin)", async () => {
    const req = {
      params: { id: "user1" },
      query: { role: "seller" },
    };
    const res = createRes();

    const orders = [{ _id: "o3" }];

    OrderMock.find.mockReturnValueOnce(makeOrderQuery(orders));

    await orderController.getOrdersForUserAdmin(req, res);

    expect(OrderMock.find).toHaveBeenCalledWith({ seller: "user1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ orders });
  });
});

// --------------------- getAllOrdersAdmin ---------------------

const makeOrderListChainAdmin = (result) => ({
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  populate: jest.fn(function (...args) {
    // Third populate call resolves to result
    if (args[0] === "seller") {
      return Promise.resolve(result);
    }
    return this;
  }),
});

describe("orderController.getAllOrdersAdmin", () => {
  test("returns paginated orders with filters", async () => {
    const req = {
      query: {
        search: "ORD",
        paymentStatus: "paid",
        fulfillmentStatus: "pending",
        deliveryType: "deliver",
        page: "1",
        limit: "10",
      },
    };
    const res = createRes();

    const orders = [
      {
        _id: "o1",
        orderNumber: "ORD-001",
        buyer: { firstName: "John", lastName: "Doe" },
        seller: { firstName: "Jane", lastName: "Smith" },
        product: { name: "Test Product" },
      },
    ];

    OrderMock.find.mockReturnValueOnce(makeOrderListChainAdmin(orders));
    OrderMock.countDocuments.mockResolvedValueOnce(1);

    await orderController.getAllOrdersAdmin(req, res);

    expect(OrderMock.find).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentStatus: "paid",
        fulfillmentStatus: "pending",
        deliveryType: "deliver",
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      orders,
      pagination: expect.objectContaining({
        total: 1,
        page: 1,
        limit: 10,
      }),
    });
  });

  test("handles pagination correctly", async () => {
    const req = {
      query: {
        page: "2",
        limit: "20",
      },
    };
    const res = createRes();

    const orders = [];

    OrderMock.find.mockReturnValueOnce(makeOrderListChainAdmin(orders));
    OrderMock.countDocuments.mockResolvedValueOnce(50);

    await orderController.getAllOrdersAdmin(req, res);

    expect(res.json).toHaveBeenCalledWith({
      orders,
      pagination: {
        total: 50,
        page: 2,
        limit: 20,
        pages: 3,
        hasNext: true,
      },
    });
  });
});

// --------------------- updateOrderStatusAdmin ---------------------

describe("orderController.updateOrderStatusAdmin", () => {
  test("returns 404 if order not found", async () => {
    const req = {
      params: { id: "order1" },
      body: { paymentStatus: "paid" },
    };
    const res = createRes();

    OrderMock.findById.mockReturnValueOnce(makeOrderQuery(null));

    await orderController.updateOrderStatusAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Order not found.",
    });
  });

  test("updates payment status", async () => {
    const req = {
      params: { id: "order1" },
      body: { paymentStatus: "refunded" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "order1",
      paymentStatus: "paid",
      fulfillmentStatus: "delivered",
      save: jest.fn().mockResolvedValue(null),
    };

    OrderMock.findById.mockReturnValueOnce(makeOrderQuery(orderDoc));

    await orderController.updateOrderStatusAdmin(req, res);

    expect(orderDoc.paymentStatus).toBe("refunded");
    expect(orderDoc.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("updates fulfillment status", async () => {
    const req = {
      params: { id: "order1" },
      body: { fulfillmentStatus: "cancelled" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "order1",
      paymentStatus: "paid",
      fulfillmentStatus: "pending",
      save: jest.fn().mockResolvedValue(null),
    };

    OrderMock.findById.mockReturnValueOnce(makeOrderQuery(orderDoc));

    await orderController.updateOrderStatusAdmin(req, res);

    expect(orderDoc.fulfillmentStatus).toBe("cancelled");
    expect(orderDoc.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("returns 400 if no status provided", async () => {
    const req = {
      params: { id: "order1" },
      body: {},
    };
    const res = createRes();

    const orderDoc = {
      _id: "order1",
      save: jest.fn().mockResolvedValue(null),
    };

    OrderMock.findById.mockReturnValueOnce(makeOrderQuery(orderDoc));

    await orderController.updateOrderStatusAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Either paymentStatus or fulfillmentStatus must be provided.",
    });
  });
});

// --------------------- getOrderStatistics ---------------------

describe("orderController.getOrderStatistics", () => {
  test("returns order statistics", async () => {
    const req = {};
    const res = createRes();

    OrderMock.countDocuments = jest
      .fn()
      .mockResolvedValueOnce(100) // total
      .mockResolvedValueOnce(10) // pending
      .mockResolvedValueOnce(70) // completed
      .mockResolvedValueOnce(5); // cancelled

    OrderMock.aggregate = jest
      .fn()
      .mockResolvedValueOnce([{ _id: null, total: 50000 }]) // revenue
      .mockResolvedValueOnce([{ _id: "paid", count: 95 }]) // by payment status
      .mockResolvedValueOnce([
        { _id: "delivered", count: 50 },
        { _id: "picked_up", count: 20 },
        { _id: "pending", count: 10 },
      ]); // by fulfillment status

    await orderController.getOrderStatistics(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      totalOrders: 100,
      totalRevenue: 50000,
      pendingOrders: 10,
      completedOrders: 70,
      cancelledOrders: 5,
      paymentStatusBreakdown: { paid: 95 },
      fulfillmentStatusBreakdown: {
        delivered: 50,
        picked_up: 20,
        pending: 10,
      },
    });
  });

  test("handles zero revenue", async () => {
    const req = {};
    const res = createRes();

    OrderMock.countDocuments = jest
      .fn()
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    OrderMock.aggregate = jest
      .fn()
      .mockResolvedValueOnce([]) // no revenue
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await orderController.getOrderStatistics(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      paymentStatusBreakdown: {},
      fulfillmentStatusBreakdown: {},
    });
  });
});
