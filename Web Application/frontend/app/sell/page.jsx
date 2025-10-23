"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProductForm from "@/components/ProductForm";
import ProductManagementCard from "@/components/ProductManagementCard";
import { MdAdd, MdInventory } from "react-icons/md";
import {
    fetchUserProducts as getUserProducts,
    createProduct as createNewProduct,
    updateProduct as updateExistingProduct,
    deleteProduct as removeProduct,
} from "@/libs/utlis";

export default function SellPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("manage");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [userProducts, setUserProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Fetch user's products when on "Your Products" tab
    useEffect(() => {
        getUserProducts().then((products) => {
            setUserProducts(products);
        });
    }, [activeTab]);

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
            await updateExistingProduct(editingProduct._id, formData);
            setSuccess("Product updated successfully!");
            setEditingProduct(null);
            fetchUserProducts();

            setTimeout(() => {
                setSuccess(null);
            }, 3000);
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
            <div className="min-h-screen bg-slate-100 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-black mb-2">
                            {editingProduct ? "Edit Product" : "Sell Your Products"}
                        </h1>
                        <p className="text-gray-600">
                            {editingProduct
                                ? "Update your product information"
                                : "List your items and manage your listings"}
                        </p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 p-4 rounded-lg">
                            <p className="font-semibold">{success}</p>
                        </div>
                    )}

                    {/* Tabs - Only show when not editing */}
                    {!editingProduct && (
                        <div className="mb-6 border-b border-slate-300">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setActiveTab("manage")}
                                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors duration-200 border-b-2 ${activeTab === "manage"
                                        ? "border-slate-800 text-slate-800"
                                        : "border-transparent text-gray-600 hover:text-slate-800"
                                        }`}
                                >
                                    <MdInventory size={20} />
                                    Your Products ({userProducts.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab("add")}
                                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors duration-200 border-b-2 ${activeTab === "add"
                                        ? "border-slate-800 text-slate-800"
                                        : "border-transparent text-gray-600 hover:text-slate-800"
                                        }`}
                                >
                                    <MdAdd size={20} />
                                    Add Product
                                </button>
                            </div>
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
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-slate-600"></div>
                                </div>
                            ) : userProducts.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {userProducts.map((product) => (
                                        <ProductManagementCard
                                            key={product._id}
                                            product={product}
                                            onEdit={handleEditClick}
                                            onDelete={handleDeleteProduct}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-white rounded-lg border border-slate-300">
                                    <MdInventory size={64} className="mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-600 text-lg mb-2">
                                        You haven't listed any products yet
                                    </p>
                                    <p className="text-gray-500 text-sm mb-6">
                                        Start selling by adding your first product
                                    </p>
                                    <button
                                        onClick={() => setActiveTab("add")}
                                        className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md transition-colors duration-200"
                                    >
                                        Add Your First Product
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
