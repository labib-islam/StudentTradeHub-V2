
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800';

// User-related functions
export const fetchUserProfile = async (userId) => {
    const res = await fetch(`${API_URL}/api/users/${userId}`);
    if (res.ok) {
        return await res.json();
    } else {
        throw new Error("Failed to fetch user profile");
    }
};

export const updateUserInfo = async (userId, updatedInfo) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedInfo)
    });
    if (res.ok) {
        const data = await res.json();
        return { data: data.user || data, error: null };
    } else {
        const errorData = await res.json();
        return { data: null, error: new Error(errorData.message || "Failed to update user info") };
    }
}

export const updateUserInfoWithPicture = async (userId, updatedInfo, profilePicFile) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication required');
        }

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('firstName', updatedInfo.first_name);
        formData.append('lastName', updatedInfo.last_name);

        // Add password fields if provided
        if (updatedInfo.currentPassword && updatedInfo.password) {
            formData.append('currentPassword', updatedInfo.currentPassword);
            formData.append('password', updatedInfo.password);
        }

        if (profilePicFile) {
            formData.append('profilePic', profilePicFile);
        }

        const res = await fetch(`${API_URL}/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            return { data: data.user || data, error: null };
        } else {
            return { data: null, error: new Error(data.message || "Failed to update user info") };
        }
    } catch (error) {
        return { data: null, error };
    }
}

// Product-related functions
export const fetchAllProducts = async () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Authentication required");
        }
        const response = await fetch(`${API_URL}/api/products/`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        return Array.isArray(data) ? data : data.products || [];
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
};

export const fetchUserProducts = async () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Authentication required");
        }

        // Get current user info
        const userResponse = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!userResponse.ok) {
            throw new Error("Failed to authenticate");
        }

        const userData = await userResponse.json();

        // Fetch all products
        const allProducts = await fetchAllProducts();

        // Filter products created by the user
        const myProducts = allProducts.filter(
            (product) => product.createdBy?._id === userData._id || product.createdBy === userData._id
        );

        return myProducts;
    } catch (error) {
        console.error("Error fetching user products:", error);
        throw error;
    }
};

export const createProduct = async (formData) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Please login to add products");
        }

        // Create FormData for file upload
        const submitData = new FormData();
        submitData.append("name", formData.name);
        submitData.append("description", formData.description);
        submitData.append("price", formData.price);
        submitData.append("category", formData.category);
        submitData.append("quantity", formData.quantity);
        submitData.append("status", formData.status);
        submitData.append("condition", formData.condition);
        submitData.append("image", formData.image);

        const response = await fetch(`${API_URL}/api/products/new`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: submitData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to create product");
        }

        return data;
    } catch (error) {
        console.error("Error creating product:", error);
        throw error;
    }
};

export const updateProduct = async (productId, formData) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Please login to update products");
        }

        const updateData = {
            name: formData.name,
            description: formData.description,
            price: formData.price,
            category: formData.category,
            quantity: formData.quantity,
            status: formData.status,
            condition: formData.condition,
        };

        const response = await fetch(`${API_URL}/api/products/${productId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to update product");
        }

        return data;
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
};

export const deleteProduct = async (productId) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Please login to delete products");
        }

        const response = await fetch(`${API_URL}/api/products/${productId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Failed to delete product");
        }

        return { success: true };
    } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
    }
};

// Orders & checkout helpers
export const fetchProductById = async (productId) => {
    try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(`${API_URL}/api/products/${productId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || "Failed to load product");
        }

        return data.product || data;
    } catch (error) {
        console.error("Error fetching product:", error);
        throw error;
    }
};

export const fetchUserPreferences = async () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Authentication required");
        }

        const res = await fetch(`${API_URL}/api/users/me/preferences`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to fetch preferences");
        }

        return data;
    } catch (error) {
        console.error("Error fetching preferences:", error);
        throw error;
    }
};

export const updateUserPreferences = async (payload) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Authentication required");
        }

        const res = await fetch(`${API_URL}/api/users/me/preferences`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || "Failed to update preferences");
        }

        return data.preferences || data;
    } catch (error) {
        console.error("Error updating preferences:", error);
        throw error;
    }
};

export const createOrder = async (payload) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Authentication required");
        }

        const res = await fetch(`${API_URL}/api/orders`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || "Failed to place order");
        }

        return data;
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

export const fetchOrders = async (role = "buyer") => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Authentication required");
        }

        const res = await fetch(`${API_URL}/api/orders?role=${role}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to load orders");
        }

        return data.orders || [];
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
};

export const fetchOrderById = async (orderId) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Authentication required");
        }

        const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to load order");
        }

        return data.order;
    } catch (error) {
        console.error("Error fetching order:", error);
        throw error;
    }
};

export const updateOrderStatus = async (orderId, status) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Authentication required");
        }

        const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || "Failed to update order status");
        }

        return data.order;
    } catch (error) {
        console.error("Error updating order status:", error);
        throw error;
    }
};

// Review-related functions
export const createReview = async (orderId, rating, comment) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Authentication required");
        }

        const res = await fetch(`${API_URL}/api/reviews`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderId, rating, comment }),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || "Failed to submit review");
        }

        return data;
    } catch (error) {
        console.error("Error creating review:", error);
        throw error;
    }
};

export const skipReview = async (orderId) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Authentication required");
        }

        const res = await fetch(`${API_URL}/api/reviews/skip`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderId }),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || "Failed to skip review");
        }

        return data;
    } catch (error) {
        console.error("Error skipping review:", error);
        throw error;
    }
};

export const getSellerReviews = async (sellerId, page = 1, limit = 10) => {
    try {
        const res = await fetch(
            `${API_URL}/api/reviews/seller/${sellerId}?page=${page}&limit=${limit}`
        );

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || "Failed to fetch reviews");
        }

        return data;
    } catch (error) {
        console.error("Error fetching seller reviews:", error);
        throw error;
    }
};

export const getReviewByOrder = async (orderId) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Authentication required");
        }

        const res = await fetch(`${API_URL}/api/reviews/order/${orderId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || "Failed to fetch review");
        }

        return data.review;
    } catch (error) {
        console.error("Error fetching review:", error);
        throw error;
    }
};
