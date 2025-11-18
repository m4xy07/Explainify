const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@clerk/nextjs': '<rootDir>/__mocks__/clerk.js',
    '^@/components/HeroAnimSource': '<rootDir>/__mocks__/ColorBends.js',
  },
}

module.exports = createJestConfig(customJestConfig)
