"use client";
import { createContext, useContext, useState } from "react";

const SearchContext = createContext();

export function SearchProvider({ children }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedCondition, setSelectedCondition] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");

    return (
        <SearchContext.Provider
            value={{
                searchTerm,
                setSearchTerm,
                selectedCategory,
                setSelectedCategory,
                selectedCondition,
                setSelectedCondition,
                selectedStatus,
                setSelectedStatus,
            }}
        >
            {children}
        </SearchContext.Provider>
    );
}

export function useSearch() {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error("useSearch must be used within a SearchProvider");
    }
    return context;
}
