// product.controller.test.js
import { jest, describe, test, expect, beforeAll, beforeEach } from "@jest/globals";

const ProductMock = function (doc) {
  Object.assign(this, doc);
  this.save = jest.fn().mockResolvedValue(this);
};
ProductMock.findById = jest.fn();
ProductMock.find = jest.fn();
ProductMock.countDocuments = jest.fn();

const UserMock = {
  findById: jest.fn(),
};

const OrderMock = {
  findOne: jest.fn(),
};

const uploadStreamMock = jest.fn((options, callback) => ({
  end: jest.fn((buffer) => {
    callback(null, {
      secure_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      public_id: "student-tradehub/products/sample",
    });
  }),
}));

const destroyMock = jest.fn().mockResolvedValue({ result: "ok" });

const sessionMock = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
};

const mongooseMock = {
  startSession: jest.fn(),
};

jest.unstable_mockModule("mongoose", () => ({
  default: mongooseMock,
  ...mongooseMock,
}));

jest.unstable_mockModule("../../models/product.model.js", () => ({
  default: ProductMock,
}));

jest.unstable_mockModule("../../models/user.model.js", () => ({
  default: UserMock,
}));

jest.unstable_mockModule("../../models/order.model.js", () => ({
  default: OrderMock,
}));

jest.unstable_mockModule("../../utils/cloudinary.js", () => ({
  default: {
    uploader: {
      upload_stream: uploadStreamMock,
      destroy: destroyMock,
    },
  },
  isCloudinaryConfigured: true,
}));

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const makeFindChain = (result) => ({
  collation: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(result),
});

let productController;

beforeAll(async () => {
  mongooseMock.startSession.mockResolvedValue(sessionMock);
  productController = (await import("../../controllers/product.controller.js")).default;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("productController.createProduct", () => {
  test("returns 400 if image file is missing", async () => {
    const req = {
      body: { name: "Item", description: "desc", price: 10, category: "books", quantity: 1 },
      file: null,
      userData: { userId: "user1" },
    };
    const res = createRes();

    await productController.createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Product image is required" });
  });

  test("creates product successfully and stores Cloudinary fields", async () => {
    const req = {
      body: {
        name: "Item",
        description: "desc",
        price: 10,
        category: "books",
        quantity: 1,
        condition: "Good",
      },
      file: { buffer: Buffer.from("image-bytes"), mimetype: "image/jpeg" },
      userData: { userId: "user1" },
    };
    const res = createRes();

    const userDoc = {
      _id: "user1",
      productList: [],
      save: jest.fn().mockResolvedValue(null),
    };
    UserMock.findById.mockResolvedValueOnce(userDoc);

    mongooseMock.startSession.mockResolvedValueOnce({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
    });

    await productController.createProduct(req, res);

    expect(uploadStreamMock).toHaveBeenCalled();
    expect(userDoc.productList.length).toBe(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      product: expect.objectContaining({
        imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        imagePublicId: "student-tradehub/products/sample",
      }),
    });
  });
});

describe("productController.getAllProducts", () => {
  test("returns products with pagination", async () => {
    const req = {
      query: { status: "all", page: "1", limit: "12" },
      userData: {},
    };
    const res = createRes();

    const products = [{ _id: "p1" }, { _id: "p2" }];
    ProductMock.find.mockReturnValueOnce(makeFindChain(products));
    ProductMock.countDocuments.mockResolvedValueOnce(2);

    await productController.getAllProducts(req, res);

    expect(res.json).toHaveBeenCalledWith({
      products,
      pagination: {
        total: 2,
        page: 1,
        limit: 12,
        pages: 1,
        hasNext: false,
      },
    });
  });
});

describe("productController.updateProduct", () => {
  test("updates product image using Cloudinary and deletes the previous image", async () => {
    const req = {
      params: { pid: "prod1" },
      body: { name: "NewName", price: 20, status: "draft", condition: "Used" },
      file: { buffer: Buffer.from("new-image-bytes"), mimetype: "image/jpeg" },
      userData: { userId: "creatorId" },
    };
    const res = createRes();

    const productDoc = {
      _id: "prod1",
      createdBy: "creatorId",
      status: "active",
      imagePublicId: "student-tradehub/products/old-image",
      save: jest.fn().mockResolvedValue(null),
    };

    ProductMock.findById.mockResolvedValueOnce(productDoc);

    await productController.updateProduct(req, res);

    expect(productDoc.imageUrl).toBe("https://res.cloudinary.com/demo/image/upload/sample.jpg");
    expect(productDoc.imagePublicId).toBe("student-tradehub/products/sample");
    expect(destroyMock).toHaveBeenCalledWith("student-tradehub/products/old-image");
    expect(res.json).toHaveBeenCalledWith({ product: productDoc });
  });
});

describe("productController.deleteProduct", () => {
  test("deletes product and Cloudinary image", async () => {
    const req = {
      params: { pid: "prod1" },
      userData: { userId: "creatorId" },
    };
    const res = createRes();

    const creator = {
      _id: "creatorId",
      productList: { pull: jest.fn() },
      save: jest.fn().mockResolvedValue(null),
    };

    const productDoc = {
      _id: "prod1",
      status: "active",
      imagePublicId: "student-tradehub/products/old-image",
      createdBy: creator,
      deleteOne: jest.fn().mockResolvedValue(null),
    };

    ProductMock.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(productDoc),
    });

    mongooseMock.startSession.mockResolvedValueOnce({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
    });

    await productController.deleteProduct(req, res);

    expect(productDoc.deleteOne).toHaveBeenCalled();
    expect(creator.productList.pull).toHaveBeenCalledWith("prod1");
    expect(destroyMock).toHaveBeenCalledWith("student-tradehub/products/old-image");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
