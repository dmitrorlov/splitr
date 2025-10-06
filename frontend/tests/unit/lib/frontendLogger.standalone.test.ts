import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Create a standalone test that doesn't conflict with global mocks
describe("frontendLogger standalone", () => {
  let mockRuntime: any;
  let originalWindow: any;
  let originalConsole: any;
  let originalImportMeta: any;

  beforeEach(() => {
    // Save originals
    originalWindow = globalThis.window;
    originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug?.bind(console) || console.log.bind(console),
      trace: console.trace?.bind(console) || console.log.bind(console),
    };
    originalImportMeta = import.meta;

    // Create mock runtime
    mockRuntime = {
      LogPrint: vi.fn(),
      LogTrace: vi.fn(),
      LogDebug: vi.fn(),
      LogInfo: vi.fn(),
      LogWarning: vi.fn(),
      LogError: vi.fn(),
      LogFatal: vi.fn(),
    };

    // Setup mock window
    globalThis.window = {
      ...globalThis.window,
      runtime: mockRuntime,
    } as any;

    // Mock import.meta.env - default to enabled
    vi.stubEnv("VITE_SPLITR_FE_FILE_LOGGING", "true");

    // Reset console methods
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
    console.trace = originalConsole.trace;

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore everything
    globalThis.window = originalWindow;
    Object.assign(console, originalConsole);
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe("basic functionality", () => {
    it("should have the required exports", async () => {
      // Clear any existing mocks and import directly
      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      expect(logger).toBeDefined();
      expect(typeof logger.initFrontendLogger).toBe("function");
      expect(typeof logger.getLoggerStats).toBe("function");
    });

    it("should initialize successfully", async () => {
      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const instance = logger.initFrontendLogger();
      expect(instance).toBeDefined();
      expect(typeof instance.markRuntimeReady).toBe("function");
    });

    it("should provide statistics", async () => {
      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      logger.initFrontendLogger();
      const stats = logger.getLoggerStats();

      expect(stats).toBeDefined();
      expect(typeof stats.serializationCount).toBe("number");
      expect(typeof stats.serializationErrors).toBe("number");
      expect(typeof stats.queueSize).toBe("number");
      expect(typeof stats.runtimeReady).toBe("boolean");
      expect(typeof stats.initialized).toBe("boolean");
      expect(typeof stats.isLoggingDisabled).toBe("boolean");
      expect(typeof stats.errorRate).toBe("number");
    });
  });

  describe("environment configuration", () => {
    it("should respect logging enabled flag", async () => {
      vi.stubEnv("VITE_SPLITR_FE_FILE_LOGGING", "true");

      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      logger.initFrontendLogger();
      const stats = logger.getLoggerStats();

      expect(stats.isLoggingDisabled).toBe(false);
      vi.unstubAllEnvs();
    });

    it("should respect logging disabled flag", async () => {
      vi.stubEnv("VITE_SPLITR_FE_FILE_LOGGING", "false");

      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      logger.initFrontendLogger();
      const stats = logger.getLoggerStats();

      expect(stats.isLoggingDisabled).toBe(true);
      vi.unstubAllEnvs();
    });
  });

  describe("console method wrapping", () => {
    it("should wrap console methods when logging enabled", async () => {
      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const originalLog = console.log;
      const originalInfo = console.info;

      logger.initFrontendLogger();

      // Console methods should be wrapped (different from original)
      const wasWrapped =
        console.log !== originalLog || console.info !== originalInfo;
      expect(wasWrapped).toBe(true);
    });

    it("should preserve console methods when logging disabled", async () => {
      vi.stubEnv("VITE_SPLITR_FE_FILE_LOGGING", "false");

      const originalLog = console.log;
      const originalInfo = console.info;

      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      logger.initFrontendLogger();

      // Console methods should remain unchanged when disabled
      expect(console.log).toBe(originalLog);
      expect(console.info).toBe(originalInfo);
      vi.unstubAllEnvs();
    });
  });

  describe("queue management", () => {
    it("should queue messages when runtime unavailable", async () => {
      // Make runtime unavailable
      globalThis.window = { ...globalThis.window, runtime: null } as any;

      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      logger.initFrontendLogger();

      // Generate some console output
      console.log("test message");

      const stats = logger.getLoggerStats();
      expect(stats.queueSize).toBeGreaterThan(0);
    });

    it("should provide queue clearing functionality", async () => {
      // Make runtime unavailable
      globalThis.window = { ...globalThis.window, runtime: null } as any;

      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const instance = logger.initFrontendLogger();

      // Add messages to queue
      console.log("message 1");
      console.log("message 2");

      expect(logger.getLoggerStats().queueSize).toBeGreaterThan(0);

      // Clear queue
      const cleared = instance.clearQueue?.();
      expect(cleared).toBeGreaterThan(0);
      expect(logger.getLoggerStats().queueSize).toBe(0);
    });

    it("should limit queue size to prevent memory issues", async () => {
      // Make runtime unavailable
      globalThis.window = { ...globalThis.window, runtime: null } as any;

      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      logger.initFrontendLogger();

      // Fill queue beyond reasonable limit
      for (let i = 0; i < 600; i++) {
        console.log(`message ${i}`);
      }

      const stats = logger.getLoggerStats();
      expect(stats.queueSize).toBeLessThanOrEqual(500); // Should be capped
    });
  });

  describe("error handling", () => {
    it("should handle runtime errors gracefully", async () => {
      // Setup runtime that throws
      mockRuntime.LogInfo = vi.fn(() => {
        throw new Error("Runtime error");
      });

      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const instance = logger.initFrontendLogger();
      instance.markRuntimeReady();

      // Should not throw even if runtime throws
      expect(() => {
        console.log("test message");
      }).not.toThrow();
    });

    it("should handle serialization errors gracefully", async () => {
      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const instance = logger.initFrontendLogger();
      instance.markRuntimeReady();

      // Create problematic object
      const problematicObj = {};
      Object.defineProperty(problematicObj, "bad", {
        get() {
          throw new Error("Serialization error");
        },
      });

      // Should not throw even with problematic objects
      expect(() => {
        console.log("problematic:", problematicObj);
      }).not.toThrow();

      // Should track serialization errors
      const stats = logger.getLoggerStats();
      expect(stats.serializationErrors).toBeGreaterThanOrEqual(0);
    });

    it("should handle missing console methods safely", async () => {
      // Remove some console methods
      const originalDebug = console.debug;
      const originalTrace = console.trace;
      delete (console as any).debug;
      delete (console as any).trace;

      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const instance = logger.initFrontendLogger();
      instance.markRuntimeReady();

      // Should initialize without throwing
      expect(instance).toBeDefined();

      // Restore
      console.debug = originalDebug;
      console.trace = originalTrace;
    });
  });

  describe("data serialization", () => {
    it("should handle various data types", async () => {
      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const instance = logger.initFrontendLogger();
      instance.markRuntimeReady();

      // Test different data types without throwing
      expect(() => {
        console.log("string", 42, true, false, null, undefined);
        console.log({ key: "value" });
        console.log([1, 2, 3]);
        console.log(new Date());
        console.log(/regex/gi);
        console.log(new Error("test"));
        console.log(function named() {});
        console.log(() => {});
      }).not.toThrow();

      const stats = logger.getLoggerStats();
      expect(stats.serializationCount).toBeGreaterThan(0);
    });

    it("should handle circular references", async () => {
      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const instance = logger.initFrontendLogger();
      instance.markRuntimeReady();

      // Create circular reference
      const obj: any = { key: "value" };
      obj.self = obj;

      expect(() => {
        console.log("circular:", obj);
      }).not.toThrow();
    });

    it("should handle DOM elements", async () => {
      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const instance = logger.initFrontendLogger();
      instance.markRuntimeReady();

      const element = document.createElement("div");
      element.id = "test-id";
      element.className = "test-class";

      expect(() => {
        console.log("element:", element);
      }).not.toThrow();
    });
  });

  describe("runtime state management", () => {
    it("should track initialization state", async () => {
      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      // Before initialization
      const statsBefore = logger.getLoggerStats();
      expect(statsBefore.initialized).toBe(false);

      // After initialization
      logger.initFrontendLogger();
      const statsAfter = logger.getLoggerStats();
      expect(statsAfter.initialized).toBe(true);
    });

    it("should track runtime ready state", async () => {
      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const instance = logger.initFrontendLogger();

      // Before marking ready
      let stats = logger.getLoggerStats();
      expect(stats.runtimeReady).toBe(false);

      // After marking ready
      instance.markRuntimeReady();
      stats = logger.getLoggerStats();
      expect(stats.runtimeReady).toBe(true);
    });

    it("should handle runtime becoming available after initialization", async () => {
      // Start with no runtime
      globalThis.window = { ...globalThis.window, runtime: null } as any;

      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const instance = logger.initFrontendLogger();

      // Add messages while runtime unavailable
      console.log("queued message 1");
      console.log("queued message 2");

      let stats = logger.getLoggerStats();
      expect(stats.queueSize).toBeGreaterThan(0);
      expect(stats.runtimeReady).toBe(false);

      // Make runtime available
      globalThis.window = { ...globalThis.window, runtime: mockRuntime } as any;
      instance.markRuntimeReady();

      stats = logger.getLoggerStats();
      expect(stats.runtimeReady).toBe(true);
    });
  });

  describe("performance and metrics", () => {
    it("should handle large volumes of logging", async () => {
      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const instance = logger.initFrontendLogger();
      instance.markRuntimeReady();

      const startTime = Date.now();

      // Log many messages
      for (let i = 0; i < 100; i++) {
        console.log(`Performance test ${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(1000);

      const stats = logger.getLoggerStats();
      expect(stats.serializationCount).toBeGreaterThanOrEqual(100);
    });

    it("should calculate error rates correctly", async () => {
      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const instance = logger.initFrontendLogger();
      instance.markRuntimeReady();

      // Log some normal messages
      console.log("normal message 1");
      console.log("normal message 2");

      const stats = logger.getLoggerStats();

      if (stats.serializationCount > 0) {
        const expectedRate =
          stats.serializationErrors / stats.serializationCount;
        expect(stats.errorRate).toBe(expectedRate);
        expect(stats.errorRate).toBeGreaterThanOrEqual(0);
        expect(stats.errorRate).toBeLessThanOrEqual(1);
      } else {
        expect(stats.errorRate).toBe(0);
      }
    });

    it("should maintain state consistency", async () => {
      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const instance = logger.initFrontendLogger();

      // Check initial state
      let stats = logger.getLoggerStats();
      const initialCount = stats.serializationCount;
      const initialErrors = stats.serializationErrors;

      instance.markRuntimeReady();

      // Perform operations
      console.log("test message 1");
      console.log("test message 2");

      // Check updated state
      stats = logger.getLoggerStats();
      expect(stats.serializationCount).toBeGreaterThanOrEqual(initialCount);
      expect(stats.serializationErrors).toBeGreaterThanOrEqual(initialErrors);
      expect(stats.runtimeReady).toBe(true);
      expect(stats.initialized).toBe(true);
    });
  });

  describe("privacy and security", () => {
    it("should handle sensitive data patterns", async () => {
      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const instance = logger.initFrontendLogger();
      instance.markRuntimeReady();

      // Test with sensitive data patterns
      const sensitiveData = {
        password: "secret123",
        apiKey: "key123",
        token: "token123",
        normalField: "normal value",
      };

      expect(() => {
        console.log("data:", sensitiveData);
      }).not.toThrow();

      // Should still track statistics
      const stats = logger.getLoggerStats();
      expect(stats.serializationCount).toBeGreaterThan(0);
    });

    it("should handle nested sensitive data", async () => {
      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const instance = logger.initFrontendLogger();
      instance.markRuntimeReady();

      const nestedSensitive = {
        user: {
          credentials: {
            password: "topsecret",
            apiToken: "token123",
          },
        },
        normalData: "safe",
      };

      expect(() => {
        console.log("nested:", nestedSensitive);
      }).not.toThrow();
    });
  });

  describe("module isolation", () => {
    it("should provide fresh state on re-import", async () => {
      // First import
      vi.resetModules();
      const logger1 = await import("../../../src/lib/frontendLogger");
      logger1.initFrontendLogger();

      const stats1 = logger1.getLoggerStats();
      expect(stats1.initialized).toBe(true);

      // Reset and re-import
      vi.resetModules();
      const logger2 = await import("../../../src/lib/frontendLogger");
      const stats2 = logger2.getLoggerStats();

      // Should have fresh state
      expect(stats2.initialized).toBe(false);
    });

    it("should handle multiple initializations safely", async () => {
      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const instance1 = logger.initFrontendLogger();
      const instance2 = logger.initFrontendLogger();

      // Both should be valid instances
      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
      expect(typeof instance1.markRuntimeReady).toBe("function");
      expect(typeof instance2.markRuntimeReady).toBe("function");

      // Should remain initialized
      const stats = logger.getLoggerStats();
      expect(stats.initialized).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle null/undefined runtime gracefully", async () => {
      // Set runtime to null
      globalThis.window = { ...globalThis.window, runtime: null } as any;

      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      expect(() => {
        logger.initFrontendLogger();
      }).not.toThrow();
    });

    it("should handle missing window object", async () => {
      // Remove window entirely
      const originalGlobalThis = globalThis.window;
      delete (globalThis as any).window;

      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      expect(() => {
        logger.initFrontendLogger();
      }).not.toThrow();

      // Restore
      globalThis.window = originalGlobalThis;
    });

    it("should handle extreme queue scenarios", async () => {
      // Make runtime unavailable
      globalThis.window = { ...globalThis.window, runtime: null } as any;

      vi.resetModules();
      const logger = await import("../../../src/lib/frontendLogger");

      const instance = logger.initFrontendLogger();

      // Try to overwhelm the queue
      for (let i = 0; i < 1000; i++) {
        console.log(`Extreme test ${i}`);
      }

      const stats = logger.getLoggerStats();
      expect(stats.queueSize).toBeLessThanOrEqual(500); // Should be bounded

      // Clear queue should work even with large queues
      const cleared = instance.clearQueue?.();
      expect(cleared).toBeGreaterThan(0);
      expect(logger.getLoggerStats().queueSize).toBe(0);
    });
  });
});
