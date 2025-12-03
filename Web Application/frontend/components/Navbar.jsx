"use client";
import { useRouter, usePathname } from "next/navigation";
import { MdLogout, MdOutlineSettings, MdPerson, MdSearch, MdFilterList } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { useState, useRef, useEffect } from "react";
import EditProfile from "./EditProfile";
import { useAuth } from "@/context/AuthContext";
import { useSearch } from "@/context/SearchContext";
import { fetchUserProfile } from "@/libs/utlis";

export default function Navbar() {
    const { user, logout, checkAuth } = useAuth();
    const {
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        selectedCondition,
        setSelectedCondition,
        selectedStatus,
        setSelectedStatus,
    } = useSearch();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchResults, setSearchResults] = useState([]);
    const dropdownRef = useRef(null);
    const router = useRouter();
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isConditionOpen, setIsConditionOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const categoryRef = useRef(null);
    const conditionRef = useRef(null);
    const statusRef = useRef(null);
    const categoriesList = [
        "all",
        "Electronics",
        "Books",
        "Furniture",
        "Clothing",
        "Sports & Outdoors",
        "Tools",
        "Home & Kitchen",
        "Other",
    ];
    const conditionsList = ["all", "Brand New", "Like New", "Good", "Used", "Damaged"];
    const statusList = ["all", "active", "draft", "inactive"];
    const orderStatusList = [
        "all",
        "pending",
        "confirmed",
        "ready_for_pickup",
        "picked_up",
        "out_for_delivery",
        "delivered",
        "cancelled",
    ];
    const pathname = usePathname();
    const isAdmin = user?.role === "admin";

    // Determine which filters to show based on current page
    const isBuyPage = !isAdmin && pathname === "/buy";
    const isSellPage = !isAdmin && pathname === "/sell";
    const isOrdersPage = !isAdmin && pathname.startsWith("/orders");
    const isAdminPage = isAdmin && pathname.startsWith("/admin");
    const showProductFilters = !isAdmin && (isBuyPage || isSellPage);
    const showOrderFilters = !isAdmin && isOrdersPage;


    useEffect(() => {
        const loadUserProfile = async () => {
            try {
                if (user && user._id) {
                    // Fetch user profile from the users table
                    const profileData = await fetchUserProfile(user._id);
                    setUserData(profileData);
                }
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
            } finally {
                setLoading(false);
            }
        };

        loadUserProfile();
    }, [user]);

    const handleSignOut = async () => {
        try {
            await logout();
            // Update user state after logout
            await checkAuth();
            // Redirect to login page
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            // Still redirect even if logout fails
            router.push('/login');
        }
    }

    const handleProfileUpdated = (updatedProfile) => {
        // Update the user data in the navbar
        setUserData(prev => ({
            ...prev,
            ...updatedProfile
        }));
    };

    const handleEditProfileClick = () => {
        setIsDropdownOpen(false);
        setIsEditProfileOpen(true);
    };

    // Close dropdown when clicking outside

    useEffect(() => {
        const handleClickOutside = (event) => {
            // 头像下拉
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            // Categories 菜单：只有点在菜单外才关
            if (categoryRef.current && !categoryRef.current.contains(event.target)) {
                setIsCategoryOpen(false);
            }
            // Condition 菜单：只有点在菜单外才关
            if (conditionRef.current && !conditionRef.current.contains(event.target)) {
                setIsConditionOpen(false);
            }
            // Status 菜单：只有点在菜单外才关
            if (statusRef.current && !statusRef.current.contains(event.target)) {
                setIsStatusOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    // Don't show navbar on login/signup pages when user is not logged in
    if (!user) {
        return null;
    }

    return (
        <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
            {/* Top Bar - Logo, Search, Profile */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 gap-4">
                    {/* Logo */}
                    <a
                        href="/"
                        className="text-2xl font-semibold text-slate-900 hover:text-slate-600 transition-colors flex-shrink-0"
                    >
                        StudentTradeHub
                    </a>

                    {/* Search Bar - Hidden on mobile, visible on md+ */}
                    {!isAdminPage && (
                        <div className="hidden md:flex items-center gap-2 flex-1 max-w-2xl mx-4">
                            <div className="relative flex-1">
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder={isOrdersPage ? "Search orders..." : "Search products..."}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Profile Dropdown */}
                    <div className="relative flex-shrink-0" ref={dropdownRef}>
                        <button
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isDropdownOpen ? 'bg-slate-100' : 'hover:bg-slate-100'
                                }`}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            {loading ? (
                                <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse"></div>
                            ) : userData?.profile_pic ? (
                                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-slate-200">
                                    <img
                                        src={userData.profile_pic}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                </div>
                            )}
                            <div className="hidden sm:block">
                                <div className="text-sm font-medium text-gray-700">
                                    {user?.firstName} {user?.lastName}
                                </div>
                                {user?.sellerRating?.totalReviews > 0 && (
                                    <div className="text-xs text-yellow-500 font-medium flex items-center gap-1">
                                        <span>★</span>
                                        <span>{user.sellerRating.averageRating.toFixed(1)}</span>
                                        <span className="text-slate-500">({user.sellerRating.totalReviews})</span>
                                    </div>
                                )}
                            </div>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 overflow-hidden">
                                {/* User info section in dropdown */}
                                <div className="px-4 py-3 border-b border-slate-100">
                                    <div className="font-medium text-gray-900 text-sm">
                                        {user?.firstName} {user?.lastName}
                                    </div>
                                    <div className="text-xs text-slate-600 mt-0.5">{user?.email}</div>
                                    {user?.sellerRating?.totalReviews > 0 && (
                                        <div className="text-xs text-yellow-500 font-medium flex items-center gap-1 mt-1">
                                            <span>★</span>
                                            <span>{user.sellerRating.averageRating.toFixed(1)}</span>
                                            <span className="text-slate-500">({user.sellerRating.totalReviews} reviews)</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-slate-100 inline-flex items-center gap-3 transition-colors"
                                    onClick={handleEditProfileClick}
                                >
                                    <MdPerson size={18} className="text-slate-500" />
                                    <span className="text-sm font-medium">Edit Profile</span>
                                </button>
                                <a
                                    href="/payment"
                                    className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-slate-100 inline-flex items-center gap-3 transition-colors text-sm"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-600">
                                        $
                                    </span>
                                    <span className="font-medium">Payment details</span>
                                </a>
                                <a
                                    href="/address"
                                    className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-slate-100 inline-flex items-center gap-3 transition-colors text-sm"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-600">
                                        🏠
                                    </span>
                                    <span className="font-medium">Address preferences</span>
                                </a>
                                <button
                                    className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-slate-50 inline-flex items-center gap-3 transition-colors"
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        handleSignOut();
                                    }}
                                >
                                    <MdLogout size={18} className="text-slate-500" />
                                    <span className="text-sm font-medium">Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Search Bar */}
                {!isAdminPage && (
                    <div className="md:hidden pb-3">
                        <div className="relative">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder={isOrdersPage ? "Search orders..." : "Search products..."}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Navigation Tabs and Filters - Mobile responsive */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 pt-2 border-t border-slate-100">
                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2">
                        {isAdmin ? (
                            <a
                                href="/admin"
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pathname.startsWith("/admin")
                                    ? "bg-slate-900 text-white"
                                    : "text-gray-700 hover:text-slate-900 hover:bg-slate-100"
                                    }`}
                            >
                                Admin
                            </a>
                        ) : (
                            <>
                                <a
                                    href="/buy"
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === "/buy"
                                        ? "bg-slate-900 text-white"
                                        : "text-gray-700 hover:text-slate-900 hover:bg-slate-100"
                                        }`}
                                >
                                    Buy
                                </a>
                                <a
                                    href="/sell"
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === "/sell"
                                        ? "bg-slate-900 text-white"
                                        : "text-gray-700 hover:text-slate-900 hover:bg-slate-100"
                                        }`}
                                >
                                    Sell
                                </a>
                                <a
                                    href="/orders"
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pathname.startsWith("/orders")
                                        ? "bg-slate-900 text-white"
                                        : "text-gray-700 hover:text-slate-900 hover:bg-slate-100"
                                        }`}
                                >
                                    Orders
                                </a>
                            </>
                        )}
                    </div>

                    {/* Filters Section */}
                    {(showProductFilters || showOrderFilters) && (
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                <MdFilterList size={18} />
                                <span className="hidden sm:inline">Filters</span>
                            </div>

                            {/* Product Filters - Show for Buy and Sell pages */}
                            {showProductFilters && (
                                <>
                                    {/* Categories Filter */}
                                    <div className="relative" ref={categoryRef}>
                                        <button
                                            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-gray-700 bg-white hover:bg-slate-100 transition-colors"
                                        >
                                            Category: {selectedCategory === "all" ? "All" : selectedCategory}
                                        </button>

                                        {isCategoryOpen && (
                                            <div className="absolute left-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3">
                                                <h3 className="font-semibold mb-2 text-gray-900 text-sm">Choose category</h3>
                                                <div className="flex flex-col gap-1">
                                                    {categoriesList.map((cat) => {
                                                        const value = cat === "all" ? "all" : cat;
                                                        return (
                                                            <button
                                                                key={cat}
                                                                onClick={() => {
                                                                    setSelectedCategory(value);
                                                                    setIsCategoryOpen(false);
                                                                }}
                                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedCategory === value
                                                                    ? "bg-slate-900 text-white"
                                                                    : "text-gray-700 hover:bg-slate-100"
                                                                    }`}
                                                            >
                                                                {cat === "all" ? "All" : cat}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Condition Filter */}
                                    <div className="relative" ref={conditionRef}>
                                        <button
                                            onClick={() => setIsConditionOpen(!isConditionOpen)}
                                            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-gray-700 bg-white hover:bg-slate-100 transition-colors"
                                        >
                                            Condition: {selectedCondition === "all" ? "All" : selectedCondition}
                                        </button>

                                        {isConditionOpen && (
                                            <div className="absolute left-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3">
                                                <h3 className="font-semibold mb-2 text-gray-900 text-sm">Choose condition</h3>
                                                <div className="flex flex-col gap-1">
                                                    {conditionsList.map((cond) => {
                                                        const value = cond === "all" ? "all" : cond;
                                                        return (
                                                            <button
                                                                key={cond}
                                                                onClick={() => {
                                                                    setSelectedCondition(value);
                                                                    setIsConditionOpen(false);
                                                                }}
                                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedCondition === value
                                                                    ? "bg-slate-900 text-white"
                                                                    : "text-gray-700 hover:bg-slate-100"
                                                                    }`}
                                                            >
                                                                {cond === "all" ? "All" : cond}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Status Filter - Show for Sell page */}
                                    {isSellPage && (
                                        <div className="relative" ref={statusRef}>
                                            <button
                                                onClick={() => setIsStatusOpen(!isStatusOpen)}
                                                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-gray-700 bg-white hover:bg-slate-100 transition-colors"
                                            >
                                                Status: {selectedStatus === "all" ? "All" : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                                            </button>
                                            {isStatusOpen && (
                                                <div className="absolute left-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3">
                                                    <h3 className="font-semibold mb-2 text-gray-900 text-sm">Choose status</h3>
                                                    <div className="flex flex-col gap-1">
                                                        {statusList.map((status) => {
                                                            const value = status === "all" ? "all" : status;
                                                            return (
                                                                <button
                                                                    key={status}
                                                                    onClick={() => {
                                                                        setSelectedStatus(value);
                                                                        setIsStatusOpen(false);
                                                                    }}
                                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedStatus === value
                                                                        ? "bg-slate-900 text-white"
                                                                        : "text-gray-700 hover:bg-slate-100"
                                                                        }`}
                                                                >
                                                                    {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Order Status Filter - Show for Orders page */}
                            {showOrderFilters && (
                                <div className="relative" ref={statusRef}>
                                    <button
                                        onClick={() => setIsStatusOpen(!isStatusOpen)}
                                        className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-gray-700 bg-white hover:bg-slate-100 transition-colors"
                                    >
                                        Status: {selectedStatus === "all" ? "All" : selectedStatus.replace(/_/g, " ")}
                                    </button>
                                    {isStatusOpen && (
                                        <div className="absolute left-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3">
                                            <h3 className="font-semibold mb-2 text-gray-900 text-sm">Choose status</h3>
                                            <div className="flex flex-col gap-1">
                                                {orderStatusList.map((status) => {
                                                    const value = status === "all" ? "all" : status;
                                                    return (
                                                        <button
                                                            key={status}
                                                            onClick={() => {
                                                                setSelectedStatus(value);
                                                                setIsStatusOpen(false);
                                                            }}
                                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedStatus === value
                                                                ? "bg-slate-900 text-white"
                                                                : "text-gray-700 hover:bg-slate-100"
                                                                }`}
                                                        >
                                                            {status === "all" ? "All" : status.replace(/_/g, " ")}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Edit Profile Modal */}
            <EditProfile
                isOpen={isEditProfileOpen}
                onClose={() => setIsEditProfileOpen(false)}
                userData={user}
                onProfileUpdate={handleProfileUpdated}
            />
        </nav>
    );
}
