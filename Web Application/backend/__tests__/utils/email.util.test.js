// email.util.test.js
import {
    jest,
    describe,
    test,
    expect,
    beforeAll,
    beforeEach,
    afterEach,
} from "@jest/globals";

// --- mock nodemailer ---
const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({
    sendMail: mockSendMail,
}));

jest.unstable_mockModule("nodemailer", () => ({
    default: {
        createTransport: mockCreateTransport,
    },
}));

let sendPasswordResetEmail;
let sendVerificationEmail;

beforeAll(async () => {
    // Import after mocks are set up
    const emailUtil = await import("../../utils/email.util.js");
    sendPasswordResetEmail = emailUtil.sendPasswordResetEmail;
    sendVerificationEmail = emailUtil.sendVerificationEmail;
});

beforeEach(() => {
    jest.clearAllMocks();
    // Set up environment variables
    process.env.EMAIL_USER = "test@studenttradehub.com";
    process.env.EMAIL_PASSWORD = "test-password";
    process.env.FRONTEND_URL = "http://localhost:3000";
});

afterEach(() => {
    // Clean up environment variables
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASSWORD;
    delete process.env.FRONTEND_URL;
});

describe("Email Utility Functions", () => {
    describe("sendPasswordResetEmail", () => {
        test("should send password reset email successfully", async () => {
            const email = "user@example.com";
            const resetToken = "test-reset-token-123";

            mockSendMail.mockResolvedValue({ messageId: "test-message-id" });

            const result = await sendPasswordResetEmail(email, resetToken);

            expect(result).toEqual({ success: true });
            expect(mockCreateTransport).toHaveBeenCalledWith({
                service: "gmail",
                auth: {
                    user: "test@studenttradehub.com",
                    pass: "test-password",
                },
            });
            expect(mockSendMail).toHaveBeenCalledTimes(1);

            const mailOptions = mockSendMail.mock.calls[0][0];
            expect(mailOptions.from).toBe("test@studenttradehub.com");
            expect(mailOptions.to).toBe(email);
            expect(mailOptions.subject).toBe(
                "Password Reset Request - StudentTradeHub"
            );
            expect(mailOptions.html).toContain(resetToken);
            expect(mailOptions.html).toContain("Password Reset Request");
            expect(mailOptions.html).toContain(
                `http://localhost:3000/reset-password?token=${resetToken}`
            );
        });

        test("should include reset URL in email body", async () => {
            const email = "user@example.com";
            const resetToken = "abc123token";

            mockSendMail.mockResolvedValue({ messageId: "test-message-id" });

            await sendPasswordResetEmail(email, resetToken);

            const mailOptions = mockSendMail.mock.calls[0][0];
            const expectedUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

            expect(mailOptions.html).toContain(expectedUrl);
            expect(mailOptions.html).toContain("Reset Password");
            expect(mailOptions.html).toContain("This link will expire in 1 hour");
        });

        test("should return error when email sending fails", async () => {
            const email = "user@example.com";
            const resetToken = "test-reset-token";
            const errorMessage = "SMTP connection failed";

            mockSendMail.mockRejectedValue(new Error(errorMessage));

            const result = await sendPasswordResetEmail(email, resetToken);

            expect(result).toEqual({
                success: false,
                error: errorMessage,
            });
            expect(mockSendMail).toHaveBeenCalledTimes(1);
        });

        test("should handle network errors gracefully", async () => {
            const email = "user@example.com";
            const resetToken = "test-token";

            mockSendMail.mockRejectedValue(new Error("Network timeout"));

            const result = await sendPasswordResetEmail(email, resetToken);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Network timeout");
        });

        test("should include security message about ignoring if not requested", async () => {
            const email = "user@example.com";
            const resetToken = "secure-token";

            mockSendMail.mockResolvedValue({ messageId: "test-id" });

            await sendPasswordResetEmail(email, resetToken);

            const mailOptions = mockSendMail.mock.calls[0][0];
            expect(mailOptions.html).toContain(
                "If you did not request this password reset"
            );
            expect(mailOptions.html).toContain("ignore this email");
        });

        test("should format email with proper styling", async () => {
            const email = "user@example.com";
            const resetToken = "token123";

            mockSendMail.mockResolvedValue({ messageId: "test-id" });

            await sendPasswordResetEmail(email, resetToken);

            const mailOptions = mockSendMail.mock.calls[0][0];
            expect(mailOptions.html).toContain("font-family: Arial");
            expect(mailOptions.html).toContain("max-width: 600px");
            expect(mailOptions.html).toContain("color: #1e3a8a");
            expect(mailOptions.html).toContain("StudentTradeHub");
        });
    });

    describe("sendVerificationEmail", () => {
        test("should send verification email successfully", async () => {
            const email = "newuser@example.com";
            const verificationToken = "verify-token-456";

            mockSendMail.mockResolvedValue({ messageId: "verification-message-id" });

            const result = await sendVerificationEmail(email, verificationToken);

            expect(result).toEqual({ success: true });
            expect(mockCreateTransport).toHaveBeenCalledWith({
                service: "gmail",
                auth: {
                    user: "test@studenttradehub.com",
                    pass: "test-password",
                },
            });
            expect(mockSendMail).toHaveBeenCalledTimes(1);

            const mailOptions = mockSendMail.mock.calls[0][0];
            expect(mailOptions.from).toBe("test@studenttradehub.com");
            expect(mailOptions.to).toBe(email);
            expect(mailOptions.subject).toBe("Verify Your Email - StudentTradeHub");
            expect(mailOptions.html).toContain(verificationToken);
            expect(mailOptions.html).toContain("Welcome to StudentTradeHub");
            expect(mailOptions.html).toContain(
                `http://localhost:3000/verify-email?token=${verificationToken}`
            );
        });

        test("should include verification URL in email body", async () => {
            const email = "newuser@example.com";
            const verificationToken = "verify123";

            mockSendMail.mockResolvedValue({ messageId: "test-message-id" });

            await sendVerificationEmail(email, verificationToken);

            const mailOptions = mockSendMail.mock.calls[0][0];
            const expectedUrl = `http://localhost:3000/verify-email?token=${verificationToken}`;

            expect(mailOptions.html).toContain(expectedUrl);
            expect(mailOptions.html).toContain("Verify Email");
            expect(mailOptions.html).toContain("This link will expire in 24 hours");
        });

        test("should return error when verification email sending fails", async () => {
            const email = "newuser@example.com";
            const verificationToken = "verify-token";
            const errorMessage = "Authentication failed";

            mockSendMail.mockRejectedValue(new Error(errorMessage));

            const result = await sendVerificationEmail(email, verificationToken);

            expect(result).toEqual({
                success: false,
                error: errorMessage,
            });
            expect(mockSendMail).toHaveBeenCalledTimes(1);
        });

        test("should handle transporter creation errors", async () => {
            const email = "user@example.com";
            const verificationToken = "token123";

            mockSendMail.mockRejectedValue(new Error("Invalid credentials"));

            const result = await sendVerificationEmail(email, verificationToken);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Invalid credentials");
        });

        test("should include welcome message and instructions", async () => {
            const email = "newuser@example.com";
            const verificationToken = "welcome-token";

            mockSendMail.mockResolvedValue({ messageId: "test-id" });

            await sendVerificationEmail(email, verificationToken);

            const mailOptions = mockSendMail.mock.calls[0][0];
            expect(mailOptions.html).toContain("Thank you for signing up");
            expect(mailOptions.html).toContain("verify your email address");
            expect(mailOptions.html).toContain("complete your registration");
        });

        test("should include security message about account creation", async () => {
            const email = "user@example.com";
            const verificationToken = "verify-secure";

            mockSendMail.mockResolvedValue({ messageId: "test-id" });

            await sendVerificationEmail(email, verificationToken);

            const mailOptions = mockSendMail.mock.calls[0][0];
            expect(mailOptions.html).toContain(
                "If you did not create an account on StudentTradeHub"
            );
            expect(mailOptions.html).toContain("ignore this email");
        });

        test("should use correct button color for verification", async () => {
            const email = "user@example.com";
            const verificationToken = "token";

            mockSendMail.mockResolvedValue({ messageId: "test-id" });

            await sendVerificationEmail(email, verificationToken);

            const mailOptions = mockSendMail.mock.calls[0][0];
            // Verification button should be green (#16a34a)
            expect(mailOptions.html).toContain("background-color: #16a34a");
        });

        test("should format verification email with proper styling", async () => {
            const email = "user@example.com";
            const verificationToken = "style-token";

            mockSendMail.mockResolvedValue({ messageId: "test-id" });

            await sendVerificationEmail(email, verificationToken);

            const mailOptions = mockSendMail.mock.calls[0][0];
            expect(mailOptions.html).toContain("font-family: Arial");
            expect(mailOptions.html).toContain("max-width: 600px");
            expect(mailOptions.html).toContain("StudentTradeHub");
            expect(mailOptions.html).toContain(
                "Student Peer-to-Peer Marketplace"
            );
        });
    });

    describe("Transporter Configuration", () => {
        test("should create transporter with correct Gmail service", async () => {
            const email = "test@example.com";
            const token = "test-token";

            mockSendMail.mockResolvedValue({ messageId: "test-id" });

            await sendPasswordResetEmail(email, token);

            expect(mockCreateTransport).toHaveBeenCalledWith({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });
        });

        test("should use environment variables for authentication", async () => {
            process.env.EMAIL_USER = "custom@example.com";
            process.env.EMAIL_PASSWORD = "custom-password";

            mockSendMail.mockResolvedValue({ messageId: "test-id" });

            await sendVerificationEmail("user@example.com", "token");

            expect(mockCreateTransport).toHaveBeenCalledWith({
                service: "gmail",
                auth: {
                    user: "custom@example.com",
                    pass: "custom-password",
                },
            });
        });

        test("should use FRONTEND_URL environment variable for links", async () => {
            process.env.FRONTEND_URL = "https://studenttradehub.com";
            const token = "test-token";

            mockSendMail.mockResolvedValue({ messageId: "test-id" });

            await sendPasswordResetEmail("user@example.com", token);

            const mailOptions = mockSendMail.mock.calls[0][0];
            expect(mailOptions.html).toContain(
                `https://studenttradehub.com/reset-password?token=${token}`
            );
        });
    });

    describe("Email Content Validation", () => {
        test("password reset email should contain all required elements", async () => {
            mockSendMail.mockResolvedValue({ messageId: "test-id" });

            await sendPasswordResetEmail("user@example.com", "token123");

            const mailOptions = mockSendMail.mock.calls[0][0];
            const html = mailOptions.html;

            // Check for key elements
            expect(html).toContain("Password Reset Request");
            expect(html).toContain("Reset Password");
            expect(html).toContain("token123");
            expect(html).toContain("1 hour");
            expect(html).toContain("StudentTradeHub");
        });

        test("verification email should contain all required elements", async () => {
            mockSendMail.mockResolvedValue({ messageId: "test-id" });

            await sendVerificationEmail("user@example.com", "verify456");

            const mailOptions = mockSendMail.mock.calls[0][0];
            const html = mailOptions.html;

            // Check for key elements
            expect(html).toContain("Welcome to StudentTradeHub");
            expect(html).toContain("Verify Email");
            expect(html).toContain("verify456");
            expect(html).toContain("24 hours");
            expect(html).toContain("StudentTradeHub");
        });

        test("emails should have different button colors", async () => {
            mockSendMail.mockResolvedValue({ messageId: "test-id" });

            await sendPasswordResetEmail("user@example.com", "reset-token");
            const resetHtml = mockSendMail.mock.calls[0][0].html;

            mockSendMail.mockClear();

            await sendVerificationEmail("user@example.com", "verify-token");
            const verifyHtml = mockSendMail.mock.calls[0][0].html;

            // Password reset should be blue (#1e3a8a)
            expect(resetHtml).toContain("background-color: #1e3a8a");
            // Verification should be green (#16a34a)
            expect(verifyHtml).toContain("background-color: #16a34a");
        });
    });

    describe("Error Handling", () => {
        test("should handle undefined email gracefully", async () => {
            mockSendMail.mockRejectedValue(new Error("Invalid recipient"));

            const result = await sendPasswordResetEmail(undefined, "token");

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test("should handle empty token gracefully", async () => {
            mockSendMail.mockResolvedValue({ messageId: "test-id" });

            const result = await sendPasswordResetEmail("user@example.com", "");

            expect(mockSendMail).toHaveBeenCalled();
            const mailOptions = mockSendMail.mock.calls[0][0];
            expect(mailOptions.html).toContain("reset-password?token=");
        });

        test("should handle special characters in email address", async () => {
            const specialEmail = "user+test@example.com";
            mockSendMail.mockResolvedValue({ messageId: "test-id" });

            const result = await sendVerificationEmail(specialEmail, "token");

            expect(result.success).toBe(true);
            expect(mockSendMail.mock.calls[0][0].to).toBe(specialEmail);
        });

        test("should handle long tokens in URLs", async () => {
            const longToken = "a".repeat(200);
            mockSendMail.mockResolvedValue({ messageId: "test-id" });

            const result = await sendPasswordResetEmail("user@example.com", longToken);

            expect(result.success).toBe(true);
            const mailOptions = mockSendMail.mock.calls[0][0];
            expect(mailOptions.html).toContain(longToken);
        });
    });
});
