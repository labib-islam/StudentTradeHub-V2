export default {
    testEnvironment: 'node',
    transform: {},
    setupFiles: ['<rootDir>/jest.setup.js'],
    testMatch: ['**/__tests__/**/*.test.js'],
    testPathIgnorePatterns: ['/node_modules/', '/__tests__/setupTestDB.js']
};
