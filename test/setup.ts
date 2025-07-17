// Global test setup
import 'reflect-metadata';

// Increase timeout for all tests
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  mockConsoleOutput: () => {
    const logs: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    (console.log as jest.Mock).mockImplementation((...args) => {
      logs.push(args.join(' '));
    });

    (console.warn as jest.Mock).mockImplementation((...args) => {
      warnings.push(args.join(' '));
    });

    (console.error as jest.Mock).mockImplementation((...args) => {
      errors.push(args.join(' '));
    });

    return { logs, warnings, errors };
  },

  restoreConsole: () => {
    jest.restoreAllMocks();
  },
};

// Type declaration for global test utilities
declare global {
  var testUtils: {
    mockConsoleOutput: () => {
      logs: string[];
      warnings: string[];
      errors: string[];
    };
    restoreConsole: () => void;
  };
}
