const config = {
	preset: 'ts-jest',
	testTimeout: 30000,
	testMatch: ['**/*.test.ts', '**/*.test.js'],
	watchPathIgnorePatterns: ['tests/.*/dist'],
};

module.exports = config
