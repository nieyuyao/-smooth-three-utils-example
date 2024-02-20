const config = {
	preset: 'ts-jest',
	testTimeout: 30000,
	testMatch: ['<rootDir>/**/*.test.ts', '<rootDir>/**/*.test.js'],
	watchPathIgnorePatterns: ['<rootDir>/tests/.*/dist'],
};

module.exports = config
