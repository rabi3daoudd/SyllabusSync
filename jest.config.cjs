module.exports = {
  projects: [
    {
      displayName: "react",
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      transform: {
        '^.+\\.(ts|tsx|js|jsx)?$': 'ts-jest',
        '^.+\\.tsx?$': 'ts-jest',
      },
      moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
      testMatch: [
        '**/tests/classes/**/*.test.(ts|tsx|js|jsx)',
        '**/tests/tasks/**/*.test.(ts|tsx|js|jsx)',
      ],
      transformIgnorePatterns: [
        "node_modules/(?!firebase|@firebase)"
      ],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^src/(.*)$': '<rootDir>/src/$1',
      },
      globals: {
        'ts-jest': {
          tsconfig: 'tsconfig.jest.json',
          isolatedModules: true,
        },
      },
    },
    {
      displayName: "api",
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/jest.setup.ts'],
      transform: {
        '^.+\\.(ts|tsx|js|jsx)?$': 'ts-jest',
      },
      moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
      testMatch: [
        '**/tests/apiTest/**/*.test.(ts|tsx|js|jsx)',
        '**/tests/App.test.tsx'
      ],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      globals: {
        'ts-jest': {
          tsconfig: 'tsconfig.jest.json',
          isolatedModules: true,
        },
      },
    },
  ],
};