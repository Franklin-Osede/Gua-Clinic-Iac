// jest.config.js para Test Containers
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$|.*\\.integration\\.test\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  testTimeout: 120000, // 2 minutos para Test Containers
  maxWorkers: 1, // Test Containers necesita ejecutarse secuencialmente
};
