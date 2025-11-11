"use client";
import { useRouter } from "next/navigation";
import { MdLogout, MdOutlineSettings, MdPerson, MdSearch, MdFilterList } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { useState, useRef, useEffect } from "react";
import EditProfile from "./EditProfile";
import { useAuth } from "@/context/AuthContext";
import { useSearch } from "@/context/SearchContext";

export default function Navbar() {
    const { user, logout, checkAuth } = useAuth();
    const { searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, selectedCondition, setSelectedCondition } = useSearch();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchResults, setSearchResults] = useState([]);
    const [categories, setCategories] = useState([]);
    const dropdownRef = useRef(null);
    const router = useRouter();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    // 新增：两个弹层开关
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isConditionOpen, setIsConditionOpen] = useState(false);
    // ↓↓↓ 新增：这两个 ref 用来“只在点击菜单外部时才关闭” ↓↓↓


    // 新增：多选结果
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedConditions, setSelectedConditions] = useState([]);
    // ↓↓↓ 新增：这两个 ref 用来“只在点击菜单外部时才关闭” ↓↓↓
    const categoryRef = useRef(null);
    const conditionRef = useRef(null);


    // 勾选/反选
    const handleCategoryToggle = (category) => {
        setSelectedCategories((prev) =>
            prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
        );
    };



    const handleConditionToggle = (condition) => {
        setSelectedConditions((prev) =>
            prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
        );
    };

    // Apply category filters
    const applyCategoryFilters = () => {
        const categoryString = selectedCategories.length > 0 ? selectedCategories.join(',') : 'all';
        setSelectedCategory(categoryString);
        setIsCategoryOpen(false);
    };

    // Apply condition filters
    const applyConditionFilters = () => {
        const conditionString = selectedConditions.length > 0 ? selectedConditions.join(',') : 'all';
        setSelectedCondition(conditionString);
        console.log("Applied Conditions:", conditionString);
        setIsConditionOpen(false);
    };

    // Clear category filters
    const clearCategoryFilters = () => {
        setSelectedCategories([]);
        setSelectedCategory('all');
    };

    // Clear condition filters
    const clearConditionFilters = () => {
        setSelectedConditions([]);
        setSelectedCondition('all');
    };


    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                if (user) {
                    // Fetch user profile from the users table
                    fetchUserProfile(user.id).then(profileData => {
                        setUserData(profileData);
                    }).catch(error => {
                        console.error("Failed to fetch user profile:", error);
                    });
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

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
        <nav className="border-b text-black p-2 mb-4 sticky top-0 z-50 bg-slate-100">
            <div className="flex justify-between items-center">
                <a href="/" className="text-2xl font-extralight p-2 cursor-pointer">StudentTradeHub</a>
                <div className="flex items-center gap-2 focus:outline-none rounded-full p-2 mr-4 w-4/5 relative">
                    <div className="relative group">
                        <MdSearch size={30} className="mr-2" />
                        {/* Tooltip */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                            Search
                        </div>
                    </div>
                    <input
                        type="text"
                        placeholder="Search Items... "
                        className="text-black rounded-full px-4 py-2 focus:outline-none flex-1 border border-slate-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative" ref={dropdownRef}>
                    <button
                        className={`flex items-center justify-center p-1 text-slate-500 hover:text-slate-600 hover:border-slate-200 hover:border-2 focus:outline-none rounded-full overflow-hidden cursor-pointer ${isDropdownOpen ? 'border-2 border-slate-400' : 'border-2 border-white'}`}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        {loading ? (
                            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                        ) : userData?.profile_pic ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                                <img
                                    src={userData.profile_pic}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <CgProfile size={40} />
                        )}
                        {/* Full name */}
                        <div className="px-2 text-base text-center whitespace-nowrap">
                            {user?.firstName} {user?.lastName}
                        </div>
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-20">
                            <button
                                className="w-full text-left px-4 py-2 text-gray-800 hover:bg-slate-100 inline-flex items-center"
                                onClick={handleEditProfileClick}
                            >
                                <MdPerson className="mr-2" /> Edit Profile
                            </button>
                            <button
                                className="w-full text-left px-4 py-2 text-gray-800 hover:bg-slate-100 inline-flex items-center"
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    handleSignOut();
                                }}
                            >
                                <MdLogout className="mr-2" /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* Navigation Links */}
            <div className="flex justify-center items-center grid-cols-3 gap-24 mx-8">
                <a
                    href="/buy"
                    className="hover:bg-slate-600 hover:text-white py-1 px-3 text-lg transition-colors duration-200"
                >
                    Buy
                </a>
                <a
                    href="/sell"
                    className="hover:bg-slate-600 hover:text-white py-1 px-3 text-lg transition-colors duration-200"
                >
                    Sell
                </a>
            </div>
            {/* Navigation Links + Filters */}
            <div className="flex justify-between items-center mx-8">
                {/* 左侧：Categories + Condition */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <MdFilterList
                            className=""
                            size={20}
                        />
                        Filters
                    </div>
                    {/* Categories 多选下拉（加 ref） */}
                    <div className="relative" ref={categoryRef}>
                        <button
                            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                            className="px-4 py-2 bg-white border border-slate-500 rounded-full text-black hover:bg-slate-100 focus:outline-none"
                        >
                            Categories
                        </button>

                        {isCategoryOpen && (
                            <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-300 rounded-lg shadow-lg z-50 p-4">
                                <h3 className="font-semibold mb-2 text-gray-700">Select Categories</h3>

                                {[
                                    "Electronics",
                                    "Books",
                                    "Furniture",
                                    "Clothing",
                                    "Sports & Outdoors",
                                    "Tools",
                                    "Home & Kitchen",
                                    "Other",
                                ].map((cat) => (
                                    <label key={cat} className="flex items-center mb-2 text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(cat)}
                                            onChange={() => handleCategoryToggle(cat)}
                                            className="mr-2 accent-slate-700"
                                        />
                                        {cat}
                                    </label>
                                ))}

                                <div className="flex justify-between mt-3">
                                    <button
                                        onClick={clearCategoryFilters}
                                        className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-100"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={applyCategoryFilters}
                                        className="px-3 py-1 bg-slate-800 text-white rounded-md text-sm hover:bg-slate-900"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Condition 多选下拉（加 ref） */}
                    <div className="relative" ref={conditionRef}>
                        <button
                            onClick={() => setIsConditionOpen(!isConditionOpen)}
                            className="px-4 py-2 bg-white border border-slate-500 rounded-full text-black hover:bg-slate-100 focus:outline-none"
                        >
                            Condition
                        </button>

                        {isConditionOpen && (
                            <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-300 rounded-lg shadow-lg z-50 p-4">
                                <h3 className="font-semibold mb-2 text-gray-700">Select Condition</h3>

                                {["Brand New", "Like New", "Good", "Used", "Damaged"].map((cond) => (
                                    <label key={cond} className="flex items-center mb-2 text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={selectedConditions.includes(cond)}
                                            onChange={() => handleConditionToggle(cond)}
                                            className="mr-2 accent-slate-700"
                                        />
                                        {cond}
                                    </label>
                                ))}

                                <div className="flex justify-between mt-3">
                                    <button
                                        onClick={clearConditionFilters}
                                        className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-100"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={applyConditionFilters}
                                        className="px-3 py-1 bg-slate-800 text-white rounded-md text-sm hover:bg-slate-900"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
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
