// controllers/review.controller.test.js
import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
} from "@jest/globals";

// ---- Mocks ----

// Review: constructor + static methods
const ReviewMock = jest.fn(function (doc) {
  Object.assign(this, doc);
  this.save = jest.fn().mockResolvedValue(this);
});
ReviewMock.find = jest.fn();
ReviewMock.findOne = jest.fn();
ReviewMock.countDocuments = jest.fn();

// Order: static methods
const OrderMock = {
  findById: jest.fn(),
  find: jest.fn(),
};

// User: static methods
const UserMock = {
  findByIdAndUpdate: jest.fn(),
};

jest.unstable_mockModule("../../models/review.model.js", () => ({
  default: ReviewMock,
}));

jest.unstable_mockModule("../../models/order.model.js", () => ({
  default: OrderMock,
}));

jest.unstable_mockModule("../../models/user.model.js", () => ({
  default: UserMock,
}));

// helper: mock res
const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// helper: for Order.findById(...).populate("seller product")
const makePopulateChain = (result) => ({
  populate: jest.fn().mockResolvedValue(result),
});

// helper: for Review.find(...).populate().populate().sort().skip().limit()
const makeReviewListChain = (result) => ({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue(result),
});

// helper: for Order.find(...).populate().populate().sort()
const makePendingOrdersChain = (result) => ({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue(result),
});

let reviewController;

beforeAll(async () => {
  reviewController = (await import("../../controllers/review.controller.js")).default;
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ------------------- createReview -------------------

describe("reviewController.createReview", () => {
  test("returns 400 when orderId or rating missing", async () => {
    const req = {
      body: { orderId: null, rating: null },
      userData: { userId: "buyer1" },
    };
    const res = createRes();

    await reviewController.createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Order ID and rating are required.",
    });
  });

  test("returns 400 when rating out of range", async () => {
    const req = {
      body: { orderId: "ord1", rating: 6 },
      userData: { userId: "buyer1" },
    };
    const res = createRes();

    await reviewController.createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Rating must be between 1 and 5.",
    });
  });

  test("returns 404 when order not found", async () => {
    const req = {
      body: { orderId: "ord1", rating: 5 },
      userData: { userId: "buyer1" },
    };
    const res = createRes();

    OrderMock.findById.mockReturnValueOnce(makePopulateChain(null));

    await reviewController.createReview(req, res);

    expect(OrderMock.findById).toHaveBeenCalledWith("ord1");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Order not found." });
  });

  test("returns 403 when buyer does not own the order", async () => {
    const req = {
      body: { orderId: "ord1", rating: 4 },
      userData: { userId: "buyerX" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "ord1",
      buyer: "buyer1", // different
      seller: { _id: "seller1" },
      product: { _id: "prod1" },
      fulfillmentStatus: "delivered",
      isReviewed: false,
    };

    OrderMock.findById.mockReturnValueOnce(makePopulateChain(orderDoc));

    await reviewController.createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "You can only review orders you purchased.",
    });
  });

  test("returns 400 when order is not completed", async () => {
    const req = {
      body: { orderId: "ord1", rating: 4 },
      userData: { userId: "buyer1" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "ord1",
      buyer: "buyer1",
      seller: { _id: "seller1" },
      product: { _id: "prod1" },
      fulfillmentStatus: "processing", // not delivered/picked_up
      isReviewed: false,
    };

    OrderMock.findById.mockReturnValueOnce(makePopulateChain(orderDoc));

    await reviewController.createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "You can only review completed orders.",
    });
  });

  test("returns 400 when order is already reviewed", async () => {
    const req = {
      body: { orderId: "ord1", rating: 4 },
      userData: { userId: "buyer1" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "ord1",
      buyer: "buyer1",
      seller: { _id: "seller1" },
      product: { _id: "prod1" },
      fulfillmentStatus: "delivered",
      isReviewed: true,
    };

    OrderMock.findById.mockReturnValueOnce(makePopulateChain(orderDoc));

    await reviewController.createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "You have already reviewed this order.",
    });
  });

  test("creates review and updates seller rating", async () => {
    const req = {
      body: { orderId: "ord1", rating: 5, comment: "Great seller" },
      userData: { userId: "buyer1" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "ord1",
      buyer: "buyer1",
      seller: { _id: "seller1" },
      product: { _id: "prod1" },
      fulfillmentStatus: "delivered",
      isReviewed: false,
      save: jest.fn().mockResolvedValue(null),
    };

    // Order.findById().populate(...).populate(...)
    OrderMock.findById.mockReturnValueOnce(makePopulateChain(orderDoc));

    // 假设数据库里已经有两条这个 seller 的 review
    const existingReviews = [{ rating: 4 }, { rating: 5 }];
    ReviewMock.find.mockResolvedValueOnce(existingReviews);

    UserMock.findByIdAndUpdate.mockResolvedValueOnce(null);

    await reviewController.createReview(req, res);

    // 从构造函数的第一个实例里拿出创建的 review
    const created = ReviewMock.mock.instances[0];
    expect(created).toMatchObject({
      order: "ord1",
      seller: "seller1",
      buyer: "buyer1",
      product: "prod1",
      rating: 5,
      comment: "Great seller",
    });
    expect(created.save).toHaveBeenCalled();

    // 订单被标记为已评论
    expect(orderDoc.isReviewed).toBe(true);
    expect(orderDoc.save).toHaveBeenCalled();

    // 平均分 & 总评论数（这里我们按 mock 的 existingReviews 来算）
    const totalRating = existingReviews.reduce(
      (sum, r) => sum + r.rating,
      0
    ); // 4 + 5 = 9
    const averageRating = totalRating / existingReviews.length; // 4.5

    expect(UserMock.findByIdAndUpdate).toHaveBeenCalledWith(
      "seller1",
      {
        "sellerRating.averageRating": averageRating,
        "sellerRating.totalReviews": existingReviews.length,
      }
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Review submitted successfully!",
      review: created,
    });
  });

});

// ------------------- getSellerReviews -------------------

describe("reviewController.getSellerReviews", () => {
  test("returns paginated reviews for a seller", async () => {
    const req = {
      params: { sellerId: "seller1" },
      query: { page: "2", limit: "2" },
    };
    const res = createRes();

    const reviews = [{ _id: "r1" }, { _id: "r2" }];

    ReviewMock.find.mockReturnValueOnce(makeReviewListChain(reviews));
    ReviewMock.countDocuments.mockResolvedValueOnce(5);

    await reviewController.getSellerReviews(req, res);

    expect(ReviewMock.find).toHaveBeenCalledWith({ seller: "seller1" });
    expect(ReviewMock.countDocuments).toHaveBeenCalledWith({
      seller: "seller1",
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      reviews,
      pagination: {
        page: 2,
        limit: 2,
        total: 5,
        pages: Math.ceil(5 / 2),
      },
    });
  });
});

// ------------------- getPendingReviews -------------------

describe("reviewController.getPendingReviews", () => {
  test("returns pending orders for current buyer", async () => {
    const req = {
      userData: { userId: "buyer1" },
    };
    const res = createRes();

    const pending = [{ _id: "ord1" }, { _id: "ord2" }];

    OrderMock.find.mockReturnValueOnce(
      makePendingOrdersChain(pending)
    );

    await reviewController.getPendingReviews(req, res);

    expect(OrderMock.find).toHaveBeenCalledWith({
      buyer: "buyer1",
      fulfillmentStatus: { $in: ["delivered", "picked_up"] },
      isReviewed: false,
      reviewSkipped: false,
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ pendingOrders: pending });
  });
});

// ------------------- skipReview -------------------

describe("reviewController.skipReview", () => {
  test("returns 404 when order not found", async () => {
    const req = {
      body: { orderId: "ord1" },
      userData: { userId: "buyer1" },
    };
    const res = createRes();

    OrderMock.findById.mockResolvedValueOnce(null);

    await reviewController.skipReview(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Order not found.",
    });
  });

  test("returns 403 when user is not buyer", async () => {
    const req = {
      body: { orderId: "ord1" },
      userData: { userId: "buyerX" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "ord1",
      buyer: "buyer1",
      reviewSkipped: false,
      save: jest.fn().mockResolvedValue(null),
    };

    OrderMock.findById.mockResolvedValueOnce(orderDoc);

    await reviewController.skipReview(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "You can only skip reviews for your own orders.",
    });
    expect(orderDoc.save).not.toHaveBeenCalled();
  });

  test("marks order as skipped and returns 200", async () => {
    const req = {
      body: { orderId: "ord1" },
      userData: { userId: "buyer1" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "ord1",
      buyer: "buyer1",
      reviewSkipped: false,
      save: jest.fn().mockResolvedValue(null),
    };

    OrderMock.findById.mockResolvedValueOnce(orderDoc);

    await reviewController.skipReview(req, res);

    expect(orderDoc.reviewSkipped).toBe(true);
    expect(orderDoc.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Review skipped." });
  });
});

// ------------------- getReviewByOrder -------------------

describe("reviewController.getReviewByOrder", () => {
  test("returns 404 if review not found", async () => {
    const req = {
      params: { orderId: "ord1" },
      userData: { userId: "buyer1" },
    };
    const res = createRes();

    ReviewMock.findOne.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      then: (resolve) => resolve(null),
    });

    await reviewController.getReviewByOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Review not found.",
    });
  });

  test("returns 403 if review does not belong to user", async () => {
    const req = {
      params: { orderId: "ord1" },
      userData: { userId: "buyerX" },
    };
    const res = createRes();

    const reviewDoc = {
      _id: "rev1",
      buyer: "buyer1",
      order: "ord1",
    };

    ReviewMock.findOne.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      then: (resolve) => resolve(reviewDoc),
    });

    await reviewController.getReviewByOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "You can only view your own reviews.",
    });
  });

  test("returns review if user owns it", async () => {
    const req = {
      params: { orderId: "ord1" },
      userData: { userId: "buyer1" },
    };
    const res = createRes();

    const reviewDoc = {
      _id: "rev1",
      buyer: "buyer1",
      order: "ord1",
      rating: 5,
      comment: "Great seller",
    };

    ReviewMock.findOne.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      then: (resolve) => resolve(reviewDoc),
    });

    await reviewController.getReviewByOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ review: reviewDoc });
  });
});

// ------------------- createReview - additional edge cases -------------------

describe("reviewController.createReview - additional tests", () => {
  test("creates review for picked_up order", async () => {
    const req = {
      body: { orderId: "ord1", rating: 4, comment: "Quick pickup" },
      userData: { userId: "buyer1" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "ord1",
      buyer: "buyer1",
      seller: { _id: "seller1" },
      product: { _id: "prod1" },
      fulfillmentStatus: "picked_up",
      isReviewed: false,
      save: jest.fn().mockResolvedValue(null),
    };

    OrderMock.findById.mockReturnValueOnce(makePopulateChain(orderDoc));
    ReviewMock.find.mockResolvedValueOnce([{ rating: 5 }]);
    UserMock.findByIdAndUpdate.mockResolvedValueOnce(null);

    await reviewController.createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Review submitted successfully!",
      review: expect.any(Object),
    });
  });

  test("handles empty comment", async () => {
    const req = {
      body: { orderId: "ord1", rating: 3 },
      userData: { userId: "buyer1" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "ord1",
      buyer: "buyer1",
      seller: { _id: "seller1" },
      product: { _id: "prod1" },
      fulfillmentStatus: "delivered",
      isReviewed: false,
      save: jest.fn().mockResolvedValue(null),
    };

    OrderMock.findById.mockReturnValueOnce(makePopulateChain(orderDoc));
    ReviewMock.find.mockResolvedValueOnce([]);
    UserMock.findByIdAndUpdate.mockResolvedValueOnce(null);

    await reviewController.createReview(req, res);

    const created = ReviewMock.mock.instances[0];
    expect(created.comment).toBe("");
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("calculates average rating correctly with multiple reviews", async () => {
    const req = {
      body: { orderId: "ord1", rating: 5, comment: "Excellent" },
      userData: { userId: "buyer1" },
    };
    const res = createRes();

    const orderDoc = {
      _id: "ord1",
      buyer: "buyer1",
      seller: { _id: "seller1" },
      product: { _id: "prod1" },
      fulfillmentStatus: "delivered",
      isReviewed: false,
      save: jest.fn().mockResolvedValue(null),
    };

    OrderMock.findById.mockReturnValueOnce(makePopulateChain(orderDoc));
    ReviewMock.find.mockResolvedValueOnce([
      { rating: 3 },
      { rating: 4 },
      { rating: 5 },
    ]);
    UserMock.findByIdAndUpdate.mockResolvedValueOnce(null);

    await reviewController.createReview(req, res);

    // Average: (3 + 4 + 5) / 3 = 4
    expect(UserMock.findByIdAndUpdate).toHaveBeenCalledWith(
      "seller1",
      {
        "sellerRating.averageRating": 4,
        "sellerRating.totalReviews": 3,
      }
    );
  });
});

// ------------------- getSellerReviews - additional tests -------------------

describe("reviewController.getSellerReviews - additional tests", () => {
  test("defaults to page 1 and limit 10", async () => {
    const req = {
      params: { sellerId: "seller1" },
      query: {},
    };
    const res = createRes();

    const reviews = [{ _id: "r1" }];

    ReviewMock.find.mockReturnValueOnce(makeReviewListChain(reviews));
    ReviewMock.countDocuments.mockResolvedValueOnce(1);

    await reviewController.getSellerReviews(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      reviews,
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        pages: 1,
      },
    });
  });

  test("handles empty reviews", async () => {
    const req = {
      params: { sellerId: "seller1" },
      query: { page: "1", limit: "10" },
    };
    const res = createRes();

    const reviews = [];

    ReviewMock.find.mockReturnValueOnce(makeReviewListChain(reviews));
    ReviewMock.countDocuments.mockResolvedValueOnce(0);

    await reviewController.getSellerReviews(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      reviews: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      },
    });
  });
});

// ------------------- getPendingReviews - additional tests -------------------

describe("reviewController.getPendingReviews - additional tests", () => {
  test("handles empty pending orders", async () => {
    const req = {
      userData: { userId: "buyer1" },
    };
    const res = createRes();

    const pending = [];

    OrderMock.find.mockReturnValueOnce(makePendingOrdersChain(pending));

    await reviewController.getPendingReviews(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ pendingOrders: [] });
  });
});
