// middlewares/fileUpload.middleware.test.js
import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
} from "@jest/globals";

// ------- Mocks & captured config -------

let capturedConfig = null;
let capturedStorageOptions = null;

const multerMock = jest.fn((config) => {
  capturedConfig = config;
  return {
    single: jest.fn(), // pretend to be a multer instance
  };
});

multerMock.diskStorage = jest.fn((opts) => {
  capturedStorageOptions = opts;
  return { _storage: true };
});

const uuidMock = jest.fn(() => "test-uuid");

// mock modules BEFORE importing fileUpload.middleware.js
jest.unstable_mockModule("multer", () => ({
  default: multerMock,
}));

jest.unstable_mockModule("uuid", () => ({
  v4: uuidMock,
}));

let fileUpload;

beforeAll(async () => {
  const mod = await import("../../middlewares/fileUpload.middleware.js");
  fileUpload = mod.default;
});

beforeEach(() => {
  jest.clearAllMocks();
});

// -------------------- Tests --------------------

describe("fileUpload middleware", () => {
  test("configures multer with correct limits, storage and fileFilter", () => {
    // when module was imported in beforeAll, multerMock was called once
    expect(capturedConfig).toBeDefined();

    // limits
    expect(capturedConfig.limits).toBe(500000);

    // storage & fileFilter exist
    expect(capturedConfig.storage).toEqual({ _storage: true });
    expect(typeof capturedConfig.fileFilter).toBe("function");

    // exported instance should look like a multer upload object
    expect(fileUpload).toBeDefined();
    expect(typeof fileUpload.single).toBe("function");
  });

  test("fileFilter accepts valid image mime types", () => {
    const { fileFilter } = capturedConfig;
    const cb = jest.fn();
    const req = {};
    const file = { mimetype: "image/png" };

    fileFilter(req, file, cb);

    expect(cb).toHaveBeenCalledWith(null, true);
  });

  test("fileFilter rejects invalid mime types", () => {
    const { fileFilter } = capturedConfig;
    const cb = jest.fn();
    const req = {};
    const file = { mimetype: "image/gif" };

    fileFilter(req, file, cb);

    const [err, isValid] = cb.mock.calls[0];
    expect(isValid).toBe(false);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Invalid mime type!");
  });

  test("destination stores files in public/images", () => {
    const { destination } = capturedStorageOptions;
    const cb = jest.fn();
    const req = {};
    const file = { mimetype: "image/png" };

    destination(req, file, cb);

    expect(cb).toHaveBeenCalledWith(null, "public/images");
  });

  test("filename uses uuid and correct extension", () => {
    const { filename } = capturedStorageOptions;
    const cb = jest.fn();
    const req = {};
    const file = { mimetype: "image/jpeg" };

    filename(req, file, cb);

    expect(uuidMock).toHaveBeenCalled();
    expect(cb).toHaveBeenCalledWith(null, "test-uuid.jpeg");
  });
});
