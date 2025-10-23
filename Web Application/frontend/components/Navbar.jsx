"use client";
import { useRouter } from "next/navigation";
import { MdLogout, MdOutlineSettings, MdPerson, MdSearch, MdFilterList } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { useState, useRef, useEffect } from "react";
import EditProfile from "./EditProfile";
import ProtectedRoute from "./ProtectedRoute";
import { logout } from "@/libs/auth";
import { useAuth } from "@/context/AuthContext";
import { useSearch } from "@/context/SearchContext";

export default function Navbar() {
    const { user } = useAuth();
    const { searchTerm, setSearchTerm, selectedCategory, setSelectedCategory } = useSearch();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchResults, setSearchResults] = useState([]);
    const [categories, setCategories] = useState([]);
    const dropdownRef = useRef(null);
    const router = useRouter();

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

    // Fetch categories from products
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("http://localhost:8800/api/products/");
                if (response.ok) {
                    const data = await response.json();
                    const productsArray = Array.isArray(data) ? data : [];
                    const uniqueCategories = [
                        ...new Set(productsArray.map((product) => product.category)),
                    ];
                    setCategories(uniqueCategories);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        fetchCategories();
    }, []);

    const handleSignOut = async () => {
        logout().then(() => {
            router.push('/login');
        });
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
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <ProtectedRoute>
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
                        {/* Category Dropdown */}
                        <div className="relative">
                            <MdFilterList
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                                size={20}
                            />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-slate-500 rounded-full text-black focus:outline-none cursor-pointer appearance-none min-w-[180px]"
                            >
                                <option value="all">All Categories</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>
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
                    {/* <a
                        href="/"
                        className="hover:bg-slate-600 hover:text-white py-1 px-3 text-lg transition-colors duration-200"
                    >
                        Home
                    </a> */}
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

                {/* Edit Profile Modal */}
                <EditProfile
                    isOpen={isEditProfileOpen}
                    onClose={() => setIsEditProfileOpen(false)}
                    userData={user}
                    onProfileUpdate={handleProfileUpdated}
                />
            </nav>
        </ProtectedRoute>
    );
}
