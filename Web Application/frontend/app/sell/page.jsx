"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProductForm from "@/components/ProductForm";
import ProductCard from "@/components/ProductCard";
import { useAuth } from "@/context/AuthContext";
import { useSearch } from "@/context/SearchContext";
import { MdAdd, MdInventory, MdSearch } from "react-icons/md";
import {
    fetchUserProducts as getUserProducts,
    createProduct as createNewProduct,
    updateProduct as updateExistingProduct,
    deleteProduct as removeProduct,
    fetchProductById,
} from "@/libs/utlis";

export default function SellPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { 
        searchTerm, 
        selectedCategory, 
        selectedCondition, 
        selectedStatus,
        setSearchTerm,
        setSelectedCategory,
        setSelectedCondition,
        setSelectedStatus,
    } = useSearch();
    const [activeTab, setActiveTab] = useState("manage");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [userProducts, setUserProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Check for edit query parameter
    useEffect(() => {
        const editProductId = searchParams.get("edit");
        if (editProductId) {
            const loadProductForEdit = async () => {
                try {
                    const product = await fetchProductById(editProductId);
                    // Verify user owns this product
                    if (product.createdBy?._id === user?._id || product.createdBy === user?._id) {
                        setEditingProduct(product);
                        setActiveTab("add");
                    }
                } catch (err) {
                    console.error("Failed to load product for editing:", err);
                }
            };
            loadProductForEdit();
        }
    }, [searchParams, user?._id]);

    // Fetch user's products when on "Your Products" tab
    useEffect(() => {
        getUserProducts().then((products) => {
            setUserProducts(products);
        });
    }, [activeTab]);

    // Filter products based on search and filters
    const filteredProducts = useMemo(() => {
        return userProducts.filter((product) => {
            // Search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch =
                    product.name?.toLowerCase().includes(searchLower) ||
                    product.description?.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }

            // Category filter
            if (selectedCategory !== "all" && product.category !== selectedCategory) {
                return false;
            }

            // Condition filter
            if (selectedCondition !== "all" && product.condition !== selectedCondition) {
                return false;
            }

            // Status filter
            if (selectedStatus !== "all" && product.status !== selectedStatus) {
                return false;
            }

            return true;
        });
    }, [userProducts, searchTerm, selectedCategory, selectedCondition, selectedStatus]);

    const fetchUserProducts = async () => {
        setProductsLoading(true);
        try {
            const myProducts = await getUserProducts();
            setUserProducts(myProducts);
        } catch (err) {
            console.error("Error fetching products:", err);
        } finally {
            setProductsLoading(false);
        }
    };

    const handleCreateProduct = async (formData, setError) => {
        setLoading(true);
        setSuccess(null);

        try {
            await createNewProduct(formData);
            setSuccess("Product created successfully!");

            // Switch to manage tab to show the new product
            setTimeout(() => {
                setActiveTab("manage");
                setSuccess(null);
            }, 2000);
        } catch (err) {
            console.error("Error creating product:", err);
            setError(err.message || "Failed to create product");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProduct = async (formData, setError) => {
        setLoading(true);
        setSuccess(null);

        try {
            const productId = editingProduct._id;
            await updateExistingProduct(productId, formData);
            setSuccess("Product updated successfully!");
            setEditingProduct(null);
            fetchUserProducts();

            // Redirect to product description page after a short delay
            setTimeout(() => {
                router.push(`/product/${productId}`);
            }, 1500);
        } catch (err) {
            console.error("Error updating product:", err);
            setError(err.message || "Failed to update product");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
        setLoading(true);
        setSuccess(null);

        try {
            await removeProduct(productId);
            setSuccess("Product deleted successfully!");
            fetchUserProducts();

            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        } catch (err) {
            console.error("Error deleting product:", err);
            alert(err.message || "Failed to delete product");
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (product) => {
        setEditingProduct(product);
    };

    const handleCancelEdit = () => {
        setEditingProduct(null);
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl sm:text-5xl font-semibold text-slate-900 mb-3">
                            {editingProduct ? "Edit Product" : "Sell Your Products"}
                        </h1>
                        <p className="text-gray-600 text-lg">
                            {editingProduct
                                ? "Update your product information"
                                : "List your items and manage your listings"}
                        </p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-sm">
                            <p className="font-semibold flex items-center gap-2">
                                <span className="text-green-500">✓</span> {success}
                            </p>
                        </div>
                    )}

                    {/* Tabs - Only show when not editing */}
                    {!editingProduct && (
                        <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-1 inline-flex">
                            <button
                                onClick={() => setActiveTab("manage")}
                                className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-lg ${activeTab === "manage"
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-slate-50"
                                    }`}
                            >
                                <MdInventory size={20} />
                                Your Products ({userProducts.length})
                            </button>
                            <button
                                onClick={() => setActiveTab("add")}
                                className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-lg ${activeTab === "add"
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-slate-50"
                                    }`}
                            >
                                <MdAdd size={20} />
                                Add Product
                            </button>
                        </div>
                    )}

                    {/* Tab Content */}
                    {(activeTab === "add" || editingProduct) && (
                        <div className="max-w-3xl mx-auto">
                            <ProductForm
                                initialData={editingProduct}
                                onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
                                onCancel={editingProduct ? handleCancelEdit : () => router.push("/buy")}
                                loading={loading}
                                submitButtonText={editingProduct ? "Update Product" : "Create Product"}
                            />
                        </div>
                    )}

                    {activeTab === "manage" && !editingProduct && (
                        <div>
                            {productsLoading ? (
                                <div className="flex justify-center items-center h-96">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-slate-600"></div>
                                        <p className="text-gray-600 font-medium">Loading your products...</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Results Count */}
                                    {userProducts.length > 0 && (
                                        <div className="mb-6 flex justify-end">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                                                Showing {filteredProducts.length} of {userProducts.length} products
                                            </div>
                                        </div>
                                    )}

                                    {/* Products Grid */}
                                    {filteredProducts.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {filteredProducts.map((product) => (
                                                <ProductCard
                                                    key={product._id}
                                                    product={product}
                                                    currentUserId={user?._id}
                                                    onEdit={handleEditClick}
                                                    onDelete={handleDeleteProduct}
                                                />
                                            ))}
                                        </div>
                                    ) : userProducts.length === 0 ? (
                                        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
                                            <div className="max-w-md mx-auto">
                                                <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                                                    <MdInventory size={48} className="text-slate-400" />
                                                </div>
                                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                    No products yet
                                                </h3>
                                                <p className="text-gray-600 mb-6">
                                                    Start selling by adding your first product to the marketplace
                                                </p>
                                                <button
                                                    onClick={() => setActiveTab("add")}
                                                    className="px-6 py-3 bg-slate-900 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
                                                >
                                                    Add Your First Product
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
                                            <div className="max-w-md mx-auto">
                                                <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                                                    <MdSearch size={48} className="text-slate-400" />
                                                </div>
                                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                    No products match your filters
                                                </h3>
                                                <p className="text-gray-600 mb-6">
                                                    Try adjusting your search or filters to find what you're looking for.
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        setSearchTerm("");
                                                        setSelectedCategory("all");
                                                        setSelectedCondition("all");
                                                        setSelectedStatus("all");
                                                    }}
                                                    className="px-6 py-3 bg-slate-900 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
                                                >
                                                    Clear Filters
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
