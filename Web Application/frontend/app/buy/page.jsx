"use client";
import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSearch } from "@/context/SearchContext";

export default function BuyPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { searchTerm, selectedCategory, selectedCategories, selectedCondition } = useSearch();

    // Fetch products from backend with filters
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);

                // Build query parameters
                const params = new URLSearchParams();

                if (searchTerm) {
                    params.append('search', searchTerm);
                }

                // Use multi-select categories if available, otherwise fall back to single category
                if (selectedCategories && selectedCategories.length > 0) {
                    selectedCategories.forEach(cat => params.append('category', cat));
                } else if (selectedCategory && selectedCategory !== 'all') {
                    params.append('category', selectedCategory);
                }

                // Add condition filters
                if (selectedCondition && selectedCondition !== 'all') {
                    params.append('condition', selectedCondition);
                }

                // Only show active products
                params.append('status', 'active');

                const response = await fetch(`http://localhost:8800/api/products/?${params.toString()}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch products");
                }

                const data = await response.json();
                console.log(data);

                // Ensure data is an array
                const productsArray = Array.isArray(data.products) ? data.products : [];
                setProducts(productsArray);
            } catch (err) {
                console.error("Error fetching products:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [searchTerm, selectedCategory, selectedCategories, selectedCondition]);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-100 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-black mb-2">
                            Browse Products
                        </h1>
                        <p className="text-gray-600">
                            Discover deals from fellow MUN people
                        </p>
                        {/* Results Count */}
                        <div className="mt-4 text-gray-600 text-sm">
                            Showing {products.length} product
                            {products.length !== 1 ? "s" : ""}
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-slate-600"></div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg mb-6">
                            <p className="font-semibold">Error loading products</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Products Grid */}
                    {!loading && !error && (
                        <>
                            {products.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {products.map((product) => (
                                        <ProductCard key={product._id} product={product} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <p className="text-gray-600 text-lg">
                                        No products found matching your criteria.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
