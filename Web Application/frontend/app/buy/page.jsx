"use client";
import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import UserRoute from "@/components/UserRoute";
import { useSearch } from "@/context/SearchContext";
import { useAuth } from "@/context/AuthContext";

export default function BuyPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { searchTerm, selectedCategory, selectedCondition } = useSearch();
    const { user, loading: authLoading } = useAuth();

    // Fetch products from backend with filters
    useEffect(() => {
        if (authLoading || !user || user.role !== 'user') {
            return;
        }

        const fetchProducts = async () => {
            try {
                setLoading(true);

                // Build query parameters
                const params = new URLSearchParams();

                if (searchTerm) {
                    params.append('search', searchTerm);
                }

                if (selectedCategory && selectedCategory !== 'all') {
                    params.append('category', selectedCategory);
                }

                // Add condition filters
                if (selectedCondition && selectedCondition !== 'all') {
                    params.append('condition', selectedCondition);
                }

                // Only show active products
                params.append('status', 'active');

                const token = localStorage.getItem("token");
                const response = await fetch(`http://localhost:8800/api/products/?${params.toString()}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch products");
                }

                const data = await response.json();

                // Ensure data is an array
                const productsArray = Array.isArray(data.products) ? data.products : [];

                // As an extra safety net, filter out products created by the current user
                const filteredProducts =
                    user && user._id
                        ? productsArray.filter(
                            (product) =>
                                product.createdBy?._id !== user._id &&
                                product.createdBy !== user._id
                        )
                        : productsArray;

                setProducts(filteredProducts);
            } catch (err) {
                console.error("Error fetching products:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [authLoading, searchTerm, selectedCategory, selectedCondition, user]);

    return (
        <UserRoute>
            <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <section className="mb-10 rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-10 flex flex-col gap-4">
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                            Student marketplace
                        </p>
                        <h1 className="text-4xl sm:text-5xl font-semibold text-slate-900 leading-tight">
                            Find quality items from trusted classmates
                        </h1>
                        <p className="text-gray-600 text-lg max-w-2xl">
                            Browse textbooks, tech, furniture, and daily essentials posted by the MUN community. Everything is listed by verified students so you can buy with confidence.
                        </p>
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <a
                                href="/sell"
                                className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
                            >
                                List an item
                            </a>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                                Showing {products.length} product{products.length !== 1 ? "s" : ""}
                            </div>
                        </div>
                    </section>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center items-center h-96">
                            <div className="flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-slate-600"></div>
                                <p className="text-gray-600 font-medium">Loading products...</p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-lg mb-6 shadow-sm">
                            <p className="font-semibold text-lg mb-1">⚠ Error loading products</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Products Grid */}
                    {!loading && !error && (
                        <>
                            {products.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {products.map((product) => (
                                        <ProductCard 
                                            key={product._id} 
                                            product={product} 
                                            currentUserId={user?._id}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
                                    <div className="max-w-md mx-auto">
                                        <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                                            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                                        <p className="text-gray-600">
                                            Try adjusting your search or filters to find what you're looking for.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </UserRoute>
    );
}
