// product.controller.test.js
import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
} from "@jest/globals";

// ---- Mocks ----

// Product: constructor + static methods
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

// mongoose session mock
const sessionMock = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
};

const mongooseMock = {
  startSession: jest.fn(),
};

// fs mock (for deleteProduct)
const fsMock = {
  existsSync: jest.fn(),
  unlink: jest.fn(),
};

jest.unstable_mockModule("mongoose", () => ({
  default: mongooseMock,
  ...mongooseMock,
}));

jest.unstable_mockModule("fs", () => ({
  default: fsMock,
  ...fsMock,
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

// helper res
const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// helper for Product.find chain
const makeFindChain = (result) => {
  return {
    collation: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(result),
  };
};

// helper for Order / Product.findById + populate
const makePopulateChain = (result) => ({
  populate: jest.fn().mockResolvedValue(result),
});

let productController;

beforeAll(async () => {
  mongooseMock.startSession.mockResolvedValue(sessionMock);
  productController = (await import("../../controllers/product.controller.js")).default;
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ------------------- createProduct -------------------

describe("productController.createProduct", () => {
  test("returns 400 if image file is missing", async () => {
    const req = {
      body: {
        name: "Item",
        description: "desc",
        price: 10,
        category: "books",
        quantity: 1,
      },
      file: null,
      userData: { userId: "user1" },
    };
    const res = createRes();

    await productController.createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Product image is required",
    });
  });

  test("returns 400 if status is inactive", async () => {
    const req = {
      body: {
        name: "Item",
        description: "desc",
        price: 10,
        category: "books",
        quantity: 1,
        status: "inactive",
      },
      file: { path: "path/to/image.jpg" },
      userData: { userId: "user1" },
    };
    const res = createRes();

    await productController.createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "Cannot create a product with inactive status. Use 'active' or 'draft'.",
    });
  });
  test("creates product successfully with default active status", async () => {
    const req = {
      body: {
        name: "Item",
        description: "desc",
        price: 10,
        category: "books",
        quantity: 1,
        condition: "new",
      },
      file: { path: "path/to/image.jpg" },
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

    // ✅ just check that one product was pushed
    expect(userDoc.productList.length).toBe(1);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      product: expect.any(Object),
    });
  });

});

// ------------------- getAllProducts -------------------

describe("productController.getAllProducts", () => {
  test("returns products with pagination", async () => {
    const req = {
      query: {
        status: "all",
        page: "1",
        limit: "12",
      },
      userData: {},
    };
    const res = createRes();

    const products = [{ _id: "p1" }, { _id: "p2" }];
    ProductMock.find.mockReturnValueOnce(makeFindChain(products));
    ProductMock.countDocuments.mockResolvedValueOnce(2);

    await productController.getAllProducts(req, res);

    expect(ProductMock.find).toHaveBeenCalledWith(
      expect.objectContaining({
        status: { $ne: "draft" },
      })
    );

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

// ------------------- getProductById -------------------

describe("productController.getProductById", () => {
  test("returns 404 if product not found", async () => {
    const req = {
      params: { pid: "prod1" },
      userData: { userId: "user1" },
    };
    const res = createRes();

    ProductMock.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(null),
    });

    await productController.getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Product not found",
    });
  });

  test("returns product if active", async () => {
    const req = {
      params: { pid: "prod1" },
      userData: { userId: "user1" },
    };
    const res = createRes();

    const productDoc = {
      _id: "prod1",
      status: "active",
      createdBy: { _id: "creatorId" },
    };

    ProductMock.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(productDoc),
    });

    await productController.getProductById(req, res);

    expect(res.json).toHaveBeenCalledWith({ product: productDoc });
  });

  test("returns 403 if inactive/draft and user not allowed", async () => {
    const req = {
      params: { pid: "prod1" },
      userData: { userId: "otherUser", role: "user" },
    };
    const res = createRes();

    const productDoc = {
      _id: "prod1",
      status: "draft",
      createdBy: { _id: "creatorId" },
    };

    ProductMock.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(productDoc),
    });

    OrderMock.findOne.mockResolvedValueOnce(null);

    await productController.getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "You are not authorized to view this product.",
    });
  });

  test("allows view if user has related order", async () => {
    const req = {
      params: { pid: "prod1" },
      userData: { userId: "buyerId", role: "user" },
    };
    const res = createRes();

    const productDoc = {
      _id: "prod1",
      status: "inactive",
      createdBy: { _id: "creatorId" },
    };

    ProductMock.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(productDoc),
    });

    OrderMock.findOne.mockResolvedValueOnce({ _id: "order1" });

    await productController.getProductById(req, res);

    expect(res.json).toHaveBeenCalledWith({ product: productDoc });
  });
});

// ------------------- updateProduct -------------------

describe("productController.updateProduct", () => {
  test("returns 404 if product not found", async () => {
    const req = {
      params: { pid: "prod1" },
      body: {},
      userData: { userId: "user1" },
    };
    const res = createRes();

    ProductMock.findById.mockResolvedValueOnce(null);

    await productController.updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Product not found.",
    });
  });

  test("returns 401 if user is not creator", async () => {
    const req = {
      params: { pid: "prod1" },
      body: {},
      userData: { userId: "otherUser" },
    };
    const res = createRes();

    const productDoc = {
      _id: "prod1",
      createdBy: "creatorId",
      status: "active",
    };

    ProductMock.findById.mockResolvedValueOnce(productDoc);

    await productController.updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "You are not allowed to edit this product.",
    });
  });

  test("returns 400 if product is inactive", async () => {
    const req = {
      params: { pid: "prod1" },
      body: {},
      userData: { userId: "creatorId" },
    };
    const res = createRes();

    const productDoc = {
      _id: "prod1",
      createdBy: "creatorId",
      status: "inactive",
    };

    ProductMock.findById.mockResolvedValueOnce(productDoc);

    await productController.updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Cannot edit a product that is sold out.",
    });
  });

  test("returns 400 if trying to set status to inactive manually", async () => {
    const req = {
      params: { pid: "prod1" },
      body: { status: "inactive" },
      userData: { userId: "creatorId" },
    };
    const res = createRes();

    const productDoc = {
      _id: "prod1",
      createdBy: "creatorId",
      status: "active",
    };

    ProductMock.findById.mockResolvedValueOnce(productDoc);

    await productController.updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "Status cannot be set to inactive. It becomes inactive automatically when sold out.",
    });
  });

  test("updates product fields and saves", async () => {
    const req = {
      params: { pid: "prod1" },
      body: {
        name: "NewName",
        price: 20,
        status: "draft",
        condition: "used",
      },
      userData: { userId: "creatorId" },
    };
    const res = createRes();

    const productDoc = {
      _id: "prod1",
      createdBy: "creatorId",
      status: "active",
      save: jest.fn().mockResolvedValue(null),
    };

    ProductMock.findById.mockResolvedValueOnce(productDoc);

    await productController.updateProduct(req, res);

    expect(productDoc.name).toBe("NewName");
    expect(productDoc.price).toBe(20);
    expect(productDoc.condition).toBe("used");
    expect(productDoc.status).toBe("draft");
    expect(productDoc.save).toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith({ product: productDoc });
  });
});

// ------------------- deleteProduct -------------------

describe("productController.deleteProduct", () => {
  test("returns 404 if product not found", async () => {
    const req = {
      params: { pid: "prod1" },
      userData: { userId: "creatorId" },
    };
    const res = createRes();

    ProductMock.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(null),
    });

    await productController.deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Product not found.",
    });
  });

  test("returns 400 if product is inactive", async () => {
    const req = {
      params: { pid: "prod1" },
      userData: { userId: "creatorId" },
    };
    const res = createRes();

    const productDoc = {
      _id: "prod1",
      status: "inactive",
      createdBy: { _id: "creatorId" },
    };

    ProductMock.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(productDoc),
    });

    await productController.deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Cannot delete a product that is sold out.",
    });
  });

  test("returns 401 if user is not creator", async () => {
    const req = {
      params: { pid: "prod1" },
      userData: { userId: "otherUser" },
    };
    const res = createRes();

    const productDoc = {
      _id: "prod1",
      status: "active",
      createdBy: { _id: "creatorId", productList: [] },
    };

    ProductMock.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(productDoc),
    });

    await productController.deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "You are not allowed to delete this product.",
    });
  });

  test("deletes product and image", async () => {
    const req = {
      params: { pid: "prod1" },
      userData: { userId: "creatorId" },
    };
    const res = createRes();

    const creator = {
      _id: "creatorId",
      productList: {
        pull: jest.fn(),
      },
      save: jest.fn().mockResolvedValue(null),
    };

    const productDoc = {
      _id: "prod1",
      status: "active",
      imageUrl: "path/to/image.jpg",
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

    fsMock.existsSync.mockReturnValueOnce(true);
    fsMock.unlink.mockImplementation((p, cb) => cb(null));

    await productController.deleteProduct(req, res);

    expect(productDoc.deleteOne).toHaveBeenCalled();
    expect(creator.productList.pull).toHaveBeenCalledWith("prod1");
    expect(creator.save).toHaveBeenCalled();
    expect(fsMock.existsSync).toHaveBeenCalledWith("path/to/image.jpg");
    expect(fsMock.unlink).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Product deleted successfully.",
    });
  });
});

// ------------------- suggestProducts -------------------

describe("productController.suggestProducts", () => {
  test("returns [] when q is missing", async () => {
    const req = { query: {} };
    const res = createRes();

    await productController.suggestProducts(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns suggestions when q is provided", async () => {
    const req = { query: { q: "Bo" } };
    const res = createRes();

    const suggestions = [{ _id: "1", name: "Book" }];

    ProductMock.find.mockReturnValueOnce({
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(suggestions),
    });

    await productController.suggestProducts(req, res);

    expect(ProductMock.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(suggestions);
  });
});

// ------------------- updateProductStatusAdmin -------------------

describe("productController.updateProductStatusAdmin", () => {
  test("returns 400 if status is invalid", async () => {
    const req = {
      params: { pid: "prod1" },
      body: { status: "invalid" },
    };
    const res = createRes();

    await productController.updateProductStatusAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid status. Must be 'active', 'inactive', or 'draft'.",
    });
  });

  test("returns 404 if product not found", async () => {
    const req = {
      params: { pid: "prod1" },
      body: { status: "active" },
    };
    const res = createRes();

    ProductMock.findById.mockResolvedValueOnce(null);

    await productController.updateProductStatusAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Product not found.",
    });
  });

  test("updates product status successfully", async () => {
    const req = {
      params: { pid: "prod1" },
      body: { status: "inactive" },
    };
    const res = createRes();

    const productDoc = {
      _id: "prod1",
      status: "active",
      save: jest.fn().mockResolvedValue(null),
    };

    ProductMock.findById.mockResolvedValueOnce(productDoc);

    await productController.updateProductStatusAdmin(req, res);

    expect(productDoc.status).toBe("inactive");
    expect(productDoc.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Product status updated successfully.",
      product: productDoc,
    });
  });
});

// ------------------- getAllProducts - additional tests -------------------

describe("productController.getAllProducts - additional filters", () => {
  test("filters by category", async () => {
    const req = {
      query: {
        category: "books",
        page: "1",
        limit: "12",
      },
      userData: {},
    };
    const res = createRes();

    const products = [{ _id: "p1", category: "books" }];
    ProductMock.find.mockReturnValueOnce(makeFindChain(products));
    ProductMock.countDocuments.mockResolvedValueOnce(1);

    await productController.getAllProducts(req, res);

    expect(res.json).toHaveBeenCalledWith({
      products,
      pagination: expect.any(Object),
    });
  });

  test("filters by condition", async () => {
    const req = {
      query: {
        condition: "new",
        page: "1",
        limit: "12",
      },
      userData: {},
    };
    const res = createRes();

    const products = [{ _id: "p1", condition: "new" }];
    ProductMock.find.mockReturnValueOnce(makeFindChain(products));
    ProductMock.countDocuments.mockResolvedValueOnce(1);

    await productController.getAllProducts(req, res);

    expect(res.json).toHaveBeenCalledWith({
      products,
      pagination: expect.any(Object),
    });
  });

  test("filters by price range", async () => {
    const req = {
      query: {
        minPrice: "10",
        maxPrice: "50",
        page: "1",
        limit: "12",
      },
      userData: {},
    };
    const res = createRes();

    const products = [{ _id: "p1", price: 25 }];
    ProductMock.find.mockReturnValueOnce(makeFindChain(products));
    ProductMock.countDocuments.mockResolvedValueOnce(1);

    await productController.getAllProducts(req, res);

    expect(res.json).toHaveBeenCalledWith({
      products,
      pagination: expect.any(Object),
    });
  });

  test("filters by inStock", async () => {
    const req = {
      query: {
        inStock: "true",
        page: "1",
        limit: "12",
      },
      userData: {},
    };
    const res = createRes();

    const products = [{ _id: "p1", quantity: 5 }];
    ProductMock.find.mockReturnValueOnce(makeFindChain(products));
    ProductMock.countDocuments.mockResolvedValueOnce(1);

    await productController.getAllProducts(req, res);

    expect(res.json).toHaveBeenCalledWith({
      products,
      pagination: expect.any(Object),
    });
  });

  test("sorts by price ascending", async () => {
    const req = {
      query: {
        sort: "price",
        page: "1",
        limit: "12",
      },
      userData: {},
    };
    const res = createRes();

    const products = [
      { _id: "p1", price: 10 },
      { _id: "p2", price: 20 },
    ];
    ProductMock.find.mockReturnValueOnce(makeFindChain(products));
    ProductMock.countDocuments.mockResolvedValueOnce(2);

    await productController.getAllProducts(req, res);

    expect(res.json).toHaveBeenCalledWith({
      products,
      pagination: expect.any(Object),
    });
  });

  test("sorts by price descending", async () => {
    const req = {
      query: {
        sort: "-price",
        page: "1",
        limit: "12",
      },
      userData: {},
    };
    const res = createRes();

    const products = [
      { _id: "p2", price: 20 },
      { _id: "p1", price: 10 },
    ];
    ProductMock.find.mockReturnValueOnce(makeFindChain(products));
    ProductMock.countDocuments.mockResolvedValueOnce(2);

    await productController.getAllProducts(req, res);

    expect(res.json).toHaveBeenCalledWith({
      products,
      pagination: expect.any(Object),
    });
  });

  test("searches by name", async () => {
    const req = {
      query: {
        search: "laptop",
        page: "1",
        limit: "12",
      },
      userData: {},
    };
    const res = createRes();

    const products = [{ _id: "p1", name: "Gaming Laptop" }];
    ProductMock.find.mockReturnValueOnce(makeFindChain(products));
    ProductMock.countDocuments.mockResolvedValueOnce(1);

    await productController.getAllProducts(req, res);

    expect(res.json).toHaveBeenCalledWith({
      products,
      pagination: expect.any(Object),
    });
  });
});

// ------------------- getProductById - additional tests -------------------

describe("productController.getProductById - additional scenarios", () => {
  test("allows admin to view draft product", async () => {
    const req = {
      params: { pid: "prod1" },
      userData: { userId: "adminUser", role: "admin" },
    };
    const res = createRes();

    const productDoc = {
      _id: "prod1",
      status: "draft",
      createdBy: { _id: "creatorId" },
    };

    ProductMock.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(productDoc),
    });

    await productController.getProductById(req, res);

    expect(res.json).toHaveBeenCalledWith({ product: productDoc });
  });

  test("allows creator to view their own inactive product", async () => {
    const req = {
      params: { pid: "prod1" },
      userData: { userId: "creatorId", role: "user" },
    };
    const res = createRes();

    const productDoc = {
      _id: "prod1",
      status: "inactive",
      createdBy: { _id: "creatorId" },
    };

    ProductMock.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(productDoc),
    });

    await productController.getProductById(req, res);

    expect(res.json).toHaveBeenCalledWith({ product: productDoc });
  });
});
