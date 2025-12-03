import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchProvider, useSearch } from '@/context/SearchContext';

const TestComponent = () => {
    const {
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        selectedCondition,
        setSelectedCondition
    } = useSearch();

    return (
        <div>
            <div>Query: {searchTerm || 'empty'}</div>
            <div>Category: {selectedCategory}</div>
            <div>Condition: {selectedCondition}</div>
            <button onClick={() => setSearchTerm('test')}>Set Query</button>
            <button onClick={() => setSelectedCategory('electronics')}>Set Category</button>
            <button onClick={() => setSelectedCondition('like-new')}>Set Condition</button>
            <button onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedCondition('all');
            }}>Clear</button>
        </div>
    );
};

describe('SearchContext', () => {
    it('should provide search context', () => {
        render(
            <SearchProvider>
                <TestComponent />
            </SearchProvider>
        );
        expect(screen.getByText('Query: empty')).toBeInTheDocument();
        expect(screen.getByText('Category: all')).toBeInTheDocument();
    });

    it('should update search term', () => {
        render(
            <SearchProvider>
                <TestComponent />
            </SearchProvider>
        );

        fireEvent.click(screen.getByText('Set Query'));
        expect(screen.getByText('Query: test')).toBeInTheDocument();
    });

    it('should update category', () => {
        render(
            <SearchProvider>
                <TestComponent />
            </SearchProvider>
        );

        fireEvent.click(screen.getByText('Set Category'));
        expect(screen.getByText('Category: electronics')).toBeInTheDocument();
    });

    it('should update condition', () => {
        render(
            <SearchProvider>
                <TestComponent />
            </SearchProvider>
        );

        fireEvent.click(screen.getByText('Set Condition'));
        expect(screen.getByText('Condition: like-new')).toBeInTheDocument();
    });

    it('should clear all filters', () => {
        render(
            <SearchProvider>
                <TestComponent />
            </SearchProvider>
        );

        fireEvent.click(screen.getByText('Set Category'));
        fireEvent.click(screen.getByText('Clear'));
        expect(screen.getByText('Category: all')).toBeInTheDocument();
        expect(screen.getByText('Query: empty')).toBeInTheDocument();
    });
});
