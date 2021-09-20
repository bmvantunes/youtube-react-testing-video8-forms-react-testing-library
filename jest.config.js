module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.jest.json',
    },
  },
  setupFilesAfterEnv: ['./src/jest.setup.ts'],
  coverageThreshold: {
    global: {
      // I'll put it back to 100 after the video =)
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20,
    },
  },
};
