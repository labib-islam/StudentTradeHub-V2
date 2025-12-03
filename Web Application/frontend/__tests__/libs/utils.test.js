import {
    fetchUserProfile,
    updateUserInfo,
    updateUserInfoWithPicture,
    fetchAllProducts,
    fetchUserProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchProductById,
    fetchUserPreferences,
    updateUserPreferences,
    createOrder,
    fetchOrders,
    fetchOrderById,
    updateOrderStatus,
    createReview,
    skipReview,
    getSellerReviews,
    getReviewByOrder,
} from '@/libs/utlis';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
});

// Mock console.error
global.console = {
    ...console,
    error: jest.fn(),
};

describe('utils.js', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
    });

    describe('User Functions', () => {
        describe('fetchUserProfile', () => {
            it('should fetch user profile successfully', async () => {
                localStorageMock.setItem('token', 'test-token');
                const mockUser = { _id: 'user-123', firstName: 'John', lastName: 'Doe' };
                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockUser,
                });

                const result = await fetchUserProfile('user-123');

                expect(fetch).toHaveBeenCalledWith('http://localhost:8800/api/users/user-123', {
                    headers: {
                        'Authorization': 'Bearer test-token'
                    }
                });
                expect(result).toEqual(mockUser);
            });

            it('should throw error if fetch fails', async () => {
                localStorageMock.setItem('token', 'test-token');
                fetch.mockResolvedValueOnce({
                    ok: false,
                });

                await expect(fetchUserProfile('user-123')).rejects.toThrow('Failed to fetch user profile');
            });
        });

        describe('updateUserInfo', () => {
            it('should update user info successfully', async () => {
                localStorageMock.setItem('token', 'test-token');
                const mockResponse = { user: { firstName: 'Jane', lastName: 'Doe' } };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
                });

                const updatedInfo = { firstName: 'Jane', lastName: 'Doe' };
                const result = await updateUserInfo('user-123', updatedInfo);

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/users/user-123',
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer test-token',
                        },
                        body: JSON.stringify(updatedInfo),
                    }
                );
                expect(result).toEqual({ data: mockResponse.user, error: null });
            });

            it('should return error when update fails', async () => {
                localStorageMock.setItem('token', 'test-token');

                fetch.mockResolvedValueOnce({
                    ok: false,
                    json: async () => ({ message: 'Update failed' }),
                });

                const result = await updateUserInfo('user-123', {});

                expect(result.data).toBeNull();
                expect(result.error).toBeInstanceOf(Error);
                expect(result.error.message).toBe('Update failed');
            });
        });

        describe('updateUserInfoWithPicture', () => {
            it('should update user info with profile picture', async () => {
                localStorageMock.setItem('token', 'test-token');
                const mockFile = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
                const mockResponse = { user: { firstName: 'John' } };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
                });

                const updatedInfo = {
                    first_name: 'John',
                    last_name: 'Doe',
                };

                const result = await updateUserInfoWithPicture('user-123', updatedInfo, mockFile);

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/users/user-123',
                    expect.objectContaining({
                        method: 'PUT',
                        headers: {
                            'Authorization': 'Bearer test-token',
                        },
                    })
                );
                expect(result).toEqual({ data: mockResponse.user, error: null });
            });

            it('should include password fields if provided', async () => {
                localStorageMock.setItem('token', 'test-token');

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ user: {} }),
                });

                const updatedInfo = {
                    first_name: 'John',
                    last_name: 'Doe',
                    currentPassword: 'oldpass',
                    password: 'newpass',
                };

                await updateUserInfoWithPicture('user-123', updatedInfo, null);

                expect(fetch).toHaveBeenCalled();
            });

            it('should return error if no token', async () => {
                const result = await updateUserInfoWithPicture('user-123', {}, null);

                expect(result.data).toBeNull();
                expect(result.error).toBeInstanceOf(Error);
                expect(result.error.message).toBe('Authentication required');
            });

            it('should return error when update fails', async () => {
                localStorageMock.setItem('token', 'test-token');

                fetch.mockResolvedValueOnce({
                    ok: false,
                    json: async () => ({ message: 'Upload failed' }),
                });

                const result = await updateUserInfoWithPicture('user-123', { first_name: 'John', last_name: 'Doe' }, null);

                expect(result.data).toBeNull();
                expect(result.error.message).toBe('Upload failed');
            });
        });
    });

    describe('Product Functions', () => {
        describe('fetchAllProducts', () => {
            it('should fetch all products successfully', async () => {
                localStorageMock.setItem('token', 'test-token');
                const mockProducts = [{ _id: '1', name: 'Product 1' }, { _id: '2', name: 'Product 2' }];

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockProducts,
                });

                const result = await fetchAllProducts();

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/products/',
                    {
                        headers: {
                            Authorization: 'Bearer test-token',
                        },
                    }
                );
                expect(result).toEqual(mockProducts);
            });

            it('should return products array from products property', async () => {
                localStorageMock.setItem('token', 'test-token');
                const mockProducts = [{ _id: '1', name: 'Product 1' }];

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ products: mockProducts }),
                });

                const result = await fetchAllProducts();
                expect(result).toEqual(mockProducts);
            });

            it('should throw error if no token', async () => {
                await expect(fetchAllProducts()).rejects.toThrow('Authentication required');
            });

            it('should throw error if fetch fails', async () => {
                localStorageMock.setItem('token', 'test-token');

                fetch.mockResolvedValueOnce({
                    ok: false,
                });

                await expect(fetchAllProducts()).rejects.toThrow('Failed to fetch products');
            });
        });

        describe('fetchUserProducts', () => {
            it('should fetch user-specific products', async () => {
                localStorageMock.setItem('token', 'test-token');

                const mockUserData = { _id: 'user-123' };
                const mockProducts = [
                    { _id: '1', name: 'Product 1', createdBy: { _id: 'user-123' } },
                    { _id: '2', name: 'Product 2', createdBy: { _id: 'other-user' } },
                ];

                fetch
                    .mockResolvedValueOnce({
                        ok: true,
                        json: async () => mockUserData,
                    })
                    .mockResolvedValueOnce({
                        ok: true,
                        json: async () => mockProducts,
                    });

                const result = await fetchUserProducts();

                expect(result).toHaveLength(1);
                expect(result[0]._id).toBe('1');
            });

            it('should handle createdBy as string ID', async () => {
                localStorageMock.setItem('token', 'test-token');

                const mockUserData = { _id: 'user-123' };
                const mockProducts = [
                    { _id: '1', name: 'Product 1', createdBy: 'user-123' },
                ];

                fetch
                    .mockResolvedValueOnce({
                        ok: true,
                        json: async () => mockUserData,
                    })
                    .mockResolvedValueOnce({
                        ok: true,
                        json: async () => mockProducts,
                    });

                const result = await fetchUserProducts();
                expect(result).toHaveLength(1);
            });

            it('should throw error if authentication fails', async () => {
                localStorageMock.setItem('token', 'test-token');

                fetch.mockResolvedValueOnce({
                    ok: false,
                });

                await expect(fetchUserProducts()).rejects.toThrow('Failed to authenticate');
            });
        });

        describe('createProduct', () => {
            it('should create a new product successfully', async () => {
                localStorageMock.setItem('token', 'test-token');
                const mockResponse = { _id: 'product-123', name: 'New Product' };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
                });

                const formData = {
                    name: 'New Product',
                    description: 'Description',
                    price: 50,
                    category: 'Electronics',
                    quantity: 1,
                    status: 'available',
                    condition: 'new',
                    image: new File(['dummy'], 'image.jpg', { type: 'image/jpeg' }),
                };

                const result = await createProduct(formData);

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/products/new',
                    expect.objectContaining({
                        method: 'POST',
                        headers: {
                            Authorization: 'Bearer test-token',
                        },
                    })
                );
                expect(result).toEqual(mockResponse);
            });

            it('should throw error if no token', async () => {
                await expect(createProduct({})).rejects.toThrow('Please login to add products');
            });

            it('should throw error if creation fails', async () => {
                localStorageMock.setItem('token', 'test-token');

                fetch.mockResolvedValueOnce({
                    ok: false,
                    json: async () => ({ message: 'Creation failed' }),
                });

                await expect(createProduct({})).rejects.toThrow('Creation failed');
            });
        });

        describe('updateProduct', () => {
            it('should update a product successfully', async () => {
                localStorageMock.setItem('token', 'test-token');
                const mockResponse = { _id: 'product-123', name: 'Updated Product' };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
                });

                const formData = {
                    name: 'Updated Product',
                    description: 'New description',
                    price: 75,
                    category: 'Books',
                    quantity: 2,
                    status: 'available',
                    condition: 'used',
                };

                const result = await updateProduct('product-123', formData);

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/products/product-123',
                    {
                        method: 'PATCH',
                        headers: {
                            Authorization: 'Bearer test-token',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData),
                    }
                );
                expect(result).toEqual(mockResponse);
            });

            it('should throw error if no token', async () => {
                await expect(updateProduct('product-123', {})).rejects.toThrow('Please login to update products');
            });
        });

        describe('deleteProduct', () => {
            it('should delete a product successfully', async () => {
                localStorageMock.setItem('token', 'test-token');

                fetch.mockResolvedValueOnce({
                    ok: true,
                });

                const result = await deleteProduct('product-123');

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/products/product-123',
                    {
                        method: 'DELETE',
                        headers: {
                            Authorization: 'Bearer test-token',
                        },
                    }
                );
                expect(result).toEqual({ success: true });
            });

            it('should throw error if no token', async () => {
                await expect(deleteProduct('product-123')).rejects.toThrow('Please login to delete products');
            });

            it('should throw error if deletion fails', async () => {
                localStorageMock.setItem('token', 'test-token');

                fetch.mockResolvedValueOnce({
                    ok: false,
                    json: async () => ({ message: 'Deletion failed' }),
                });

                await expect(deleteProduct('product-123')).rejects.toThrow('Deletion failed');
            });
        });

        describe('fetchProductById', () => {
            it('should fetch product by ID with token', async () => {
                localStorageMock.setItem('token', 'test-token');
                const mockProduct = { _id: 'product-123', name: 'Test Product' };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ product: mockProduct }),
                });

                const result = await fetchProductById('product-123');

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/products/product-123',
                    {
                        headers: { Authorization: 'Bearer test-token' },
                    }
                );
                expect(result).toEqual(mockProduct);
            });

            it('should fetch product without token', async () => {
                const mockProduct = { _id: 'product-123', name: 'Test Product' };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockProduct,
                });

                const result = await fetchProductById('product-123');

                expect(result).toEqual(mockProduct);
            });

            it('should throw error if fetch fails', async () => {
                fetch.mockResolvedValueOnce({
                    ok: false,
                    json: async () => ({ message: 'Product not found' }),
                });

                await expect(fetchProductById('product-123')).rejects.toThrow('Product not found');
            });
        });
    });

    describe('User Preferences Functions', () => {
        describe('fetchUserPreferences', () => {
            it('should fetch user preferences successfully', async () => {
                localStorageMock.setItem('token', 'test-token');
                const mockPreferences = { theme: 'dark', notifications: true };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockPreferences,
                });

                const result = await fetchUserPreferences();

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/users/me/preferences',
                    {
                        headers: { Authorization: 'Bearer test-token' },
                    }
                );
                expect(result).toEqual(mockPreferences);
            });

            it('should throw error if no token', async () => {
                await expect(fetchUserPreferences()).rejects.toThrow('Authentication required');
            });
        });

        describe('updateUserPreferences', () => {
            it('should update user preferences successfully', async () => {
                localStorageMock.setItem('token', 'test-token');
                const mockPreferences = { theme: 'light' };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ preferences: mockPreferences }),
                });

                const result = await updateUserPreferences({ theme: 'light' });

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/users/me/preferences',
                    {
                        method: 'PATCH',
                        headers: {
                            Authorization: 'Bearer test-token',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ theme: 'light' }),
                    }
                );
                expect(result).toEqual(mockPreferences);
            });

            it('should throw error if no token', async () => {
                await expect(updateUserPreferences({})).rejects.toThrow('Authentication required');
            });
        });
    });

    describe('Order Functions', () => {
        describe('createOrder', () => {
            it('should create an order successfully', async () => {
                localStorageMock.setItem('token', 'test-token');
                const mockOrder = { _id: 'order-123', status: 'pending' };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockOrder,
                });

                const payload = { productId: 'product-123', quantity: 1 };
                const result = await createOrder(payload);

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/orders',
                    {
                        method: 'POST',
                        headers: {
                            Authorization: 'Bearer test-token',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    }
                );
                expect(result).toEqual(mockOrder);
            });

            it('should throw error if no token', async () => {
                await expect(createOrder({})).rejects.toThrow('Authentication required');
            });
        });

        describe('fetchOrders', () => {
            it('should fetch orders as buyer', async () => {
                localStorageMock.setItem('token', 'test-token');
                const mockOrders = [{ _id: 'order-1' }, { _id: 'order-2' }];

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ orders: mockOrders }),
                });

                const result = await fetchOrders('buyer');

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/orders?role=buyer',
                    {
                        headers: { Authorization: 'Bearer test-token' },
                    }
                );
                expect(result).toEqual(mockOrders);
            });

            it('should fetch orders as seller', async () => {
                localStorageMock.setItem('token', 'test-token');

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ orders: [] }),
                });

                await fetchOrders('seller');

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/orders?role=seller',
                    expect.any(Object)
                );
            });

            it('should throw error if no token', async () => {
                await expect(fetchOrders()).rejects.toThrow('Authentication required');
            });
        });

        describe('fetchOrderById', () => {
            it('should fetch order by ID successfully', async () => {
                localStorageMock.setItem('token', 'test-token');
                const mockOrder = { _id: 'order-123', status: 'completed' };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ order: mockOrder }),
                });

                const result = await fetchOrderById('order-123');

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/orders/order-123',
                    {
                        headers: { Authorization: 'Bearer test-token' },
                    }
                );
                expect(result).toEqual(mockOrder);
            });

            it('should throw error if no token', async () => {
                await expect(fetchOrderById('order-123')).rejects.toThrow('Authentication required');
            });
        });

        describe('updateOrderStatus', () => {
            it('should update order status successfully', async () => {
                localStorageMock.setItem('token', 'test-token');
                const mockOrder = { _id: 'order-123', status: 'shipped' };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ order: mockOrder }),
                });

                const result = await updateOrderStatus('order-123', 'shipped');

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/orders/order-123/status',
                    {
                        method: 'PATCH',
                        headers: {
                            Authorization: 'Bearer test-token',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ status: 'shipped' }),
                    }
                );
                expect(result).toEqual(mockOrder);
            });

            it('should throw error if no token', async () => {
                await expect(updateOrderStatus('order-123', 'shipped')).rejects.toThrow('Authentication required');
            });
        });
    });

    describe('Review Functions', () => {
        describe('createReview', () => {
            it('should create a review successfully', async () => {
                localStorageMock.setItem('token', 'test-token');
                const mockReview = { _id: 'review-123', rating: 5 };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockReview,
                });

                const result = await createReview('order-123', 5, 'Great product!');

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/reviews',
                    {
                        method: 'POST',
                        headers: {
                            Authorization: 'Bearer test-token',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ orderId: 'order-123', rating: 5, comment: 'Great product!' }),
                    }
                );
                expect(result).toEqual(mockReview);
            });

            it('should throw error if no token', async () => {
                await expect(createReview('order-123', 5, 'Comment')).rejects.toThrow('Authentication required');
            });
        });

        describe('skipReview', () => {
            it('should skip review successfully', async () => {
                localStorageMock.setItem('token', 'test-token');
                const mockResponse = { message: 'Review skipped' };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse,
                });

                const result = await skipReview('order-123');

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/reviews/skip',
                    {
                        method: 'POST',
                        headers: {
                            Authorization: 'Bearer test-token',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ orderId: 'order-123' }),
                    }
                );
                expect(result).toEqual(mockResponse);
            });

            it('should throw error if no token', async () => {
                await expect(skipReview('order-123')).rejects.toThrow('Authentication required');
            });
        });

        describe('getSellerReviews', () => {
            it('should fetch seller reviews with default pagination', async () => {
                const mockReviews = { reviews: [{ _id: 'review-1' }], total: 1 };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockReviews,
                });

                const result = await getSellerReviews('seller-123');

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/reviews/seller/seller-123?page=1&limit=10'
                );
                expect(result).toEqual(mockReviews);
            });

            it('should fetch seller reviews with custom pagination', async () => {
                const mockReviews = { reviews: [], total: 0 };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockReviews,
                });

                await getSellerReviews('seller-123', 2, 20);

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/reviews/seller/seller-123?page=2&limit=20'
                );
            });

            it('should throw error if fetch fails', async () => {
                fetch.mockResolvedValueOnce({
                    ok: false,
                    json: async () => ({ message: 'Failed to fetch reviews' }),
                });

                await expect(getSellerReviews('seller-123')).rejects.toThrow('Failed to fetch reviews');
            });
        });

        describe('getReviewByOrder', () => {
            it('should fetch review by order ID', async () => {
                localStorageMock.setItem('token', 'test-token');
                const mockReview = { _id: 'review-123', rating: 4 };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ review: mockReview }),
                });

                const result = await getReviewByOrder('order-123');

                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:8800/api/reviews/order/order-123',
                    {
                        headers: {
                            Authorization: 'Bearer test-token',
                        },
                    }
                );
                expect(result).toEqual(mockReview);
            });

            it('should throw error if no token', async () => {
                await expect(getReviewByOrder('order-123')).rejects.toThrow('Authentication required');
            });
        });
    });
});
