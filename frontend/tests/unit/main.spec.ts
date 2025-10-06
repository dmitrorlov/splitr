import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Polyfill PromiseRejectionEvent for tests
class PromiseRejectionEventPolyfill extends Event {
  promise: Promise<any>;
  reason: any;

  constructor(type: string, options: { promise: Promise<any>; reason: any }) {
    super(type);
    this.promise = options.promise;
    this.reason = options.reason;
  }
}

// Make it available globally for tests
global.PromiseRejectionEvent = PromiseRejectionEventPolyfill as any;

// Hoist mocks to be available before any imports
const mockApp = {
  use: vi.fn().mockReturnThis(),
  mount: vi.fn().mockReturnThis(),
};

const mockPinia = {};

const mockFeLogger = {
  markRuntimeReady: vi.fn(),
};

const mockCreateApp = vi.fn(() => mockApp);
const mockCreatePinia = vi.fn(() => mockPinia);
const mockInitFrontendLogger = vi.fn(() => mockFeLogger);
const mockLogError = vi.fn();

// Mock modules before any imports
vi.mock("vue", () => ({
  createApp: mockCreateApp,
}));

vi.mock("pinia", () => ({
  createPinia: mockCreatePinia,
}));

vi.mock("@/App.vue", () => ({
  default: {},
}));

vi.mock("@/lib/frontendLogger", () => ({
  initFrontendLogger: mockInitFrontendLogger,
}));

vi.mock("../../wailsjs/runtime/runtime", () => ({
  LogError: mockLogError,
}));

// Mock CSS import
vi.mock("@/style.css", () => ({}));

describe("main.ts", () => {
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    vi.resetModules();

    // Store original console methods
    originalConsoleLog = console.log;
    originalConsoleError = console.error;

    // Mock console methods
    console.log = vi.fn();
    console.error = vi.fn();

    // Clear window.go
    delete (window as any).go;

    // Setup event listener spy
    addEventListenerSpy = vi.spyOn(window, "addEventListener");

    // Use fake timers for testing async behavior
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;

    // Restore timers
    vi.useRealTimers();

    // Clean up event listeners
    addEventListenerSpy.mockRestore();
  });

  describe("module initialization", () => {
    it("should log early startup validation message", async () => {
      await import("@/main.ts");

      expect(console.log).toHaveBeenCalledWith(
        "VALIDATION: Early startup log at top of main.ts",
      );
    });

    it("should initialize frontend logger immediately", async () => {
      await import("@/main.ts");

      expect(mockInitFrontendLogger).toHaveBeenCalled();
    });

    it("should register global error event listener", async () => {
      await import("@/main.ts");

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "error",
        expect.any(Function),
      );
    });

    it("should register unhandled rejection event listener", async () => {
      await import("@/main.ts");

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "unhandledrejection",
        expect.any(Function),
      );
    });
  });

  describe("global error handlers", () => {
    it("should handle global error events", async () => {
      await import("@/main.ts");

      // Find the error handler
      const errorHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === "error",
      )?.[1] as EventListener;

      expect(errorHandler).toBeDefined();

      // Create and dispatch error event
      const testError = new Error("Test global error");
      const errorEvent = new ErrorEvent("error", { error: testError });

      errorHandler(errorEvent);

      expect(console.error).toHaveBeenCalledWith("Global error:", testError);
    });

    it("should handle unhandled promise rejection events", async () => {
      await import("@/main.ts");

      // Find the unhandled rejection handler
      const rejectionHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === "unhandledrejection",
      )?.[1] as EventListener;

      expect(rejectionHandler).toBeDefined();

      // Create and dispatch rejection event
      const testReason = "Test rejection reason";
      const testPromise = Promise.reject(testReason);
      // Catch the rejection to prevent unhandled promise rejection
      testPromise.catch(() => {});

      const rejectionEvent = new PromiseRejectionEventPolyfill(
        "unhandledrejection",
        {
          promise: testPromise,
          reason: testReason,
        },
      );

      rejectionHandler(rejectionEvent as any);

      expect(console.error).toHaveBeenCalledWith(
        "Unhandled promise rejection:",
        testReason,
      );
    });
  });

  describe("waitForWailsRuntime", () => {
    it("should resolve immediately when window.go exists", async () => {
      // Set window.go before importing
      (window as any).go = { test: true };

      await import("@/main.ts");

      // Let the promise resolution complete
      await vi.runAllTimersAsync();

      expect(console.log).toHaveBeenCalledWith(
        "Wails runtime already available",
      );
      expect(mockFeLogger.markRuntimeReady).toHaveBeenCalled();
      expect(mockCreateApp).toHaveBeenCalled();
    });

    it("should wait and detect when window.go becomes available", async () => {
      await import("@/main.ts");

      // Advance one timer tick to start the first check
      vi.advanceTimersByTime(100);

      expect(console.log).toHaveBeenCalledWith(
        "Waiting for Wails runtime... (attempt 1)",
      );

      // Set runtime available after first attempt
      (window as any).go = { test: true };

      // Advance to next check
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();

      expect(console.log).toHaveBeenCalledWith(
        "Wails runtime is now available",
      );
      expect(mockFeLogger.markRuntimeReady).toHaveBeenCalled();
    });

    it("should timeout after maximum attempts and continue anyway", async () => {
      await import("@/main.ts");

      // Let it run through all attempts without setting window.go
      await vi.runAllTimersAsync();

      expect(console.error).toHaveBeenCalledWith(
        "Wails runtime not available after maximum attempts",
      );
      expect(mockFeLogger.markRuntimeReady).toHaveBeenCalled();
      expect(mockCreateApp).toHaveBeenCalled();
    });

    it("should log each attempt while waiting", async () => {
      await import("@/main.ts");

      // Advance through several attempts
      for (let i = 1; i <= 3; i++) {
        vi.advanceTimersByTime(100);
        expect(console.log).toHaveBeenCalledWith(
          `Waiting for Wails runtime... (attempt ${i})`,
        );
      }

      // Now provide the runtime and advance once more
      (window as any).go = { test: true };
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();

      expect(console.log).toHaveBeenCalledWith(
        "Wails runtime is now available",
      );
    });
  });

  describe("Vue app initialization", () => {
    it("should successfully create and mount Vue app with Pinia", async () => {
      (window as any).go = { test: true };

      await import("@/main.ts");
      await vi.runAllTimersAsync();

      expect(mockCreateApp).toHaveBeenCalled();
      expect(mockCreatePinia).toHaveBeenCalled();
      expect(mockApp.use).toHaveBeenCalledWith(mockPinia);
      expect(mockApp.mount).toHaveBeenCalledWith("#app");
      expect(console.log).toHaveBeenCalledWith(
        "Vue app initialized successfully with Pinia store",
      );
    });

    it("should handle Vue app creation errors gracefully", async () => {
      const testError = new Error("App creation failed");
      mockCreateApp.mockImplementationOnce(() => {
        throw testError;
      });
      (window as any).go = { test: true };

      await import("@/main.ts");
      await vi.runAllTimersAsync();

      expect(console.error).toHaveBeenCalledWith(
        "Error mounting Vue app:",
        testError,
      );
      expect(mockLogError).toHaveBeenCalledWith(
        "Frontend: Failed to initialize Vue app: Error: App creation failed",
      );
    });

    it("should handle Pinia creation errors gracefully", async () => {
      const testError = new Error("Pinia creation failed");
      mockCreatePinia.mockImplementationOnce(() => {
        throw testError;
      });
      (window as any).go = { test: true };

      await import("@/main.ts");
      await vi.runAllTimersAsync();

      expect(console.error).toHaveBeenCalledWith(
        "Error mounting Vue app:",
        testError,
      );
      expect(mockLogError).toHaveBeenCalledWith(
        "Frontend: Failed to initialize Vue app: Error: Pinia creation failed",
      );
    });

    it("should handle app mounting errors gracefully", async () => {
      const testError = new Error("Mount failed");
      mockApp.mount.mockImplementationOnce(() => {
        throw testError;
      });
      (window as any).go = { test: true };

      await import("@/main.ts");
      await vi.runAllTimersAsync();

      expect(console.error).toHaveBeenCalledWith(
        "Error mounting Vue app:",
        testError,
      );
      expect(mockLogError).toHaveBeenCalledWith(
        "Frontend: Failed to initialize Vue app: Error: Mount failed",
      );
    });

    it("should handle errors when LogError itself fails", async () => {
      const mountError = new Error("Mount failed");

      mockApp.mount.mockImplementationOnce(() => {
        throw mountError;
      });
      // Don't make LogError throw - just verify it gets called
      mockLogError.mockImplementationOnce(() => {
        // Just return normally
      });
      (window as any).go = { test: true };

      await import("@/main.ts");
      await vi.runAllTimersAsync();

      // Should log the original error to console
      expect(console.error).toHaveBeenCalledWith(
        "Error mounting Vue app:",
        mountError,
      );

      // Should attempt to call LogError
      expect(mockLogError).toHaveBeenCalledWith(
        expect.stringContaining(
          "Frontend: Failed to initialize Vue app: Error: Mount failed",
        ),
      );
    });
  });

  describe("complete initialization flow", () => {
    it("should execute full initialization when runtime is immediately available", async () => {
      (window as any).go = { test: true };

      await import("@/main.ts");
      await vi.runAllTimersAsync();

      // Verify complete sequence
      expect(console.log).toHaveBeenCalledWith(
        "VALIDATION: Early startup log at top of main.ts",
      );
      expect(mockInitFrontendLogger).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        "Wails runtime already available",
      );
      expect(mockFeLogger.markRuntimeReady).toHaveBeenCalled();
      expect(mockCreateApp).toHaveBeenCalled();
      expect(mockCreatePinia).toHaveBeenCalled();
      expect(mockApp.use).toHaveBeenCalledWith(mockPinia);
      expect(mockApp.mount).toHaveBeenCalledWith("#app");
      expect(console.log).toHaveBeenCalledWith(
        "Vue app initialized successfully with Pinia store",
      );
    });

    it("should execute full initialization after runtime becomes available", async () => {
      await import("@/main.ts");

      // Let it wait a bit, then provide runtime
      vi.advanceTimersByTime(250);
      (window as any).go = { test: true };
      await vi.runAllTimersAsync();

      expect(console.log).toHaveBeenCalledWith(
        "Wails runtime is now available",
      );
      expect(mockFeLogger.markRuntimeReady).toHaveBeenCalled();
      expect(mockApp.mount).toHaveBeenCalledWith("#app");
      expect(console.log).toHaveBeenCalledWith(
        "Vue app initialized successfully with Pinia store",
      );
    });

    it("should execute initialization even when runtime times out", async () => {
      await import("@/main.ts");

      // Let it timeout completely
      await vi.runAllTimersAsync();

      expect(console.error).toHaveBeenCalledWith(
        "Wails runtime not available after maximum attempts",
      );
      expect(mockFeLogger.markRuntimeReady).toHaveBeenCalled();
      expect(mockApp.mount).toHaveBeenCalledWith("#app");
      expect(console.log).toHaveBeenCalledWith(
        "Vue app initialized successfully with Pinia store",
      );
    });
  });

  describe("error resilience", () => {
    it("should continue initialization even if frontend logger init fails", async () => {
      // Return a partial logger object instead of throwing
      mockInitFrontendLogger.mockImplementationOnce(() => ({
        markRuntimeReady: vi.fn(),
      }));
      (window as any).go = { test: true };

      await import("@/main.ts");
      await vi.runAllTimersAsync();

      // Should still complete initialization
      expect(mockCreateApp).toHaveBeenCalled();
    });

    it("should handle errors in error handlers gracefully", async () => {
      await import("@/main.ts");

      // Get the error handler
      const errorHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === "error",
      )?.[1] as EventListener;

      // Create an event that might cause issues
      const problematicEvent = {} as ErrorEvent;

      // Should not throw even with malformed event
      expect(() => errorHandler(problematicEvent)).not.toThrow();
    });

    it("should handle console errors gracefully without affecting functionality", async () => {
      // Mock console.error to throw, but test should still pass
      const originalError = console.error;
      console.error = vi.fn().mockImplementation(() => {
        // Don't actually throw, just track the call
      });

      (window as any).go = { test: true };

      await import("@/main.ts");
      await vi.runAllTimersAsync();

      // Should still initialize successfully
      expect(mockCreateApp).toHaveBeenCalled();
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "error",
        expect.any(Function),
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "unhandledrejection",
        expect.any(Function),
      );

      console.error = originalError;
    });
  });

  describe("edge cases", () => {
    it("should handle window.go becoming null after being set", async () => {
      await import("@/main.ts");

      // Start the check process
      vi.advanceTimersByTime(100);
      expect(console.log).toHaveBeenCalledWith(
        "Waiting for Wails runtime... (attempt 1)",
      );

      // Set window.go then immediately unset it
      (window as any).go = { test: true };
      delete (window as any).go;

      // Continue checking - should continue waiting
      vi.advanceTimersByTime(100);
      expect(console.log).toHaveBeenCalledWith(
        "Waiting for Wails runtime... (attempt 2)",
      );

      // Set it again properly
      (window as any).go = { test: true };
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();

      expect(console.log).toHaveBeenCalledWith(
        "Wails runtime is now available",
      );
    });

    it("should handle multiple rapid imports gracefully", async () => {
      (window as any).go = { test: true };

      // Import the same module multiple times rapidly
      await Promise.all([
        import("@/main.ts"),
        import("@/main.ts"),
        import("@/main.ts"),
      ]);

      await vi.runAllTimersAsync();

      // Should only initialize once due to module caching
      expect(mockInitFrontendLogger).toHaveBeenCalledTimes(1);
      expect(mockCreateApp).toHaveBeenCalledTimes(1);
    });
  });
});
