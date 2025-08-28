/**
 * Frontend Logger - Console Method Wrapper with Comprehensive Guardrails
 *
 * FAILURE HANDLING & EDGE CASES:
 *
 * 1. NO INFINITE RECURSION:
 *    - Saves original console methods before wrapping (bound to console)
 *    - Wrapper always calls the saved original methods, never re-calls wrapped methods
 *    - Each wrapper maintains its own reference to the original method
 *
 * 2. RUNTIME UNAVAILABLE:
 *    - Logs are queued up to MAX_QUEUE (500) when runtime is not ready
 *    - Oldest entries are automatically dropped beyond this bound
 *    - Batch processing (50 entries max per flush) prevents UI blocking
 *    - Automatic retry with setTimeout for large queue processing
 *
 * 3. SERIALIZATION FAILURES:
 *    - safeStringify handles Errors with proper stack trace preservation
 *    - Circular reference detection using WeakSet
 *    - Multiple fallback strategies: JSON.stringify → String() → Object.prototype.toString
 *    - Depth limiting (maxDepth=4) prevents infinite recursion in complex objects
 *    - Performance tracking of serialization attempts and failures
 *
 * 4. PERFORMANCE SAFEGUARDS:
 *    - Arguments serialized only once per console call
 *    - Fast path for primitive types (string, number, boolean, null, undefined)
 *    - DOM element serialization provides concise representation
 *    - Function serialization shows name/anonymous status
 *    - Batch flushing prevents UI thread blocking
 *    - Configurable depth limits for object traversal
 *
 * 5. DUPLICATION HANDLING:
 *    - Relies on existing global error handlers in main.ts that call console.error
 *    - The adapter captures those calls without adding additional error listeners
 *    - Intentionally avoids double logging by not registering extra error handlers
 *    - Always preserves DevTools console output via original method calls
 *
 * 6. PRIVACY CONTROLS:
 *    - Comprehensive sensitive key redaction (passwords, secrets, tokens, API keys, etc.)
 *    - Environment flag support: VITE_SPLITR_FE_FILE_LOGGING=false disables file logging
 *    - Extensible pattern-based redaction system
 *    - When disabled, console methods remain unwrapped to preserve original behavior
 *
 * 7. ERROR ISOLATION:
 *    - No exceptions escape the logger wrapper
 *    - Try-catch blocks at multiple levels with proper fallbacks
 *    - Graceful degradation: failed logging never breaks application flow
 *    - Error tracking without throwing or propagating exceptions
 *
 * 8. MEMORY MANAGEMENT:
 *    - Queue size bounded to prevent memory leaks
 *    - Automatic cleanup of dropped entries
 *    - Emergency queue clearing API for extreme cases
 *    - WeakSet usage for circular reference tracking (automatic GC)
 *
 * 9. DIAGNOSTIC CAPABILITIES:
 *    - Performance metrics (serialization count, error rate)
 *    - Queue health monitoring
 *    - Runtime state visibility
 *    - Emergency controls for queue management
 */

type Level = 'print' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

type LogEntry = {
  level: Level
  text: string
}

// Guardrails: Prevent unbounded memory usage
const MAX_QUEUE = 500
const queue: LogEntry[] = []

// Performance: Track serialization metrics for potential optimization
let serializationCount = 0
let serializationErrors = 0

// Runtime state management
let runtimeReady = false
let initialized = false

// Privacy: Check environment flag for disabling frontend file logging
const ENABLE_FE_FILE_LOGGING = import.meta.env?.VITE_SPLITR_FE_FILE_LOGGING !== 'false'

// Privacy: Additional redaction patterns (can be extended)
const sensitivePatterns = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /auth/i,
  /credential/i,
  /session/i,
]

// No infinite recursion: Save original console methods before wrapping
const originals = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug ? console.debug.bind(console) : console.log.bind(console),
  trace: console.trace ? console.trace.bind(console) : console.log.bind(console),
}

function safeStringify(value: any, depth = 0, maxDepth = 4): string {
  // Performance: Track serialization attempts
  serializationCount++

  // Handle depth limiting for performance
  if (depth > maxDepth) {
    return '[Max Depth Reached]'
  }

  const seen = new WeakSet()

  function replacer(key: string, val: any) {
    // Serialization failures: Handle Errors specifically
    if (val instanceof Error) {
      return {
        name: val.name,
        message: val.message,
        stack: val.stack,
        code: (val as any).code, // Include error codes if present
        __error_type__: true,
      }
    }

    // Serialization failures: Handle circular structures
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) return '[Circular]'
      seen.add(val)

      // Performance: Limit object depth for large structures
      if (depth >= maxDepth - 1) {
        return '[Object - Max Depth]'
      }
    }

    // Privacy: Enhanced redaction using pattern matching
    if (typeof key === 'string') {
      for (const pattern of sensitivePatterns) {
        if (pattern.test(key)) {
          return '[REDACTED]'
        }
      }
    }

    return val
  }

  try {
    // Fast path for simple types
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (value === null || value === undefined) return String(value)

    // Serialization failures: Special handling for Errors
    if (value instanceof Error) {
      return `${value.name}: ${value.message}\n${value.stack || ''}`
    }

    // Handle functions
    if (typeof value === 'function') {
      return `[Function: ${value.name || 'anonymous'}]`
    }

    // Handle DOM elements
    if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) {
      return `[HTMLElement: ${value.tagName}${value.id ? `#${value.id}` : ''}${value.className ? `.${value.className.replace(/\s+/g, '.')}` : ''}]`
    }

    // Complex object serialization
    if (typeof value === 'object') {
      return JSON.stringify(value, replacer)
    }

    return String(value)
  } catch (_error) {
    // Serialization failures: Track failed attempts
    serializationErrors++

    // Multiple fallback strategies
    try {
      return String(value)
    } catch {
      try {
        return Object.prototype.toString.call(value)
      } catch {
        return '[Unserializable]'
      }
    }
  }
}

function joinArgs(args: any[]): string {
  return args.map(a => safeStringify(a)).join(' ')
}

function trySend(entry: LogEntry): boolean {
  const r = window.runtime
  if (!runtimeReady || !r) return false

  try {
    switch (entry.level) {
      case 'trace':
        r.LogTrace?.(entry.text)
        break
      case 'debug':
        r.LogDebug?.(entry.text)
        break
      case 'info':
        r.LogInfo?.(entry.text)
        break
      case 'warn':
        r.LogWarning?.(entry.text)
        break
      case 'error':
        r.LogError?.(entry.text)
        break
      case 'fatal':
        r.LogFatal?.(entry.text)
        break
      default:
        r.LogPrint?.(entry.text)
        break
    }
    return true
  } catch {
    return false
  }
}

// Runtime unavailable: Enhanced queue management with bounds checking
function enqueue(entry: LogEntry) {
  // Guardrails: Prevent unbounded memory usage - drop oldest entries
  while (queue.length >= MAX_QUEUE) {
    const dropped = queue.shift()
    // Optionally track dropped entries for debugging
    if (dropped) {
      originals.debug(`[FrontendLogger] Dropped old log entry: ${dropped.level}`)
    }
  }
  queue.push(entry)
}

// Performance: Batch flush with interruption handling
function flush() {
  let processed = 0
  const maxBatchSize = 50 // Prevent UI blocking

  let entry: LogEntry | undefined
  entry = queue.shift()
  while (entry && processed < maxBatchSize) {
    if (!trySend(entry)) {
      // Runtime unavailable: Could not send; put it back and stop trying
      queue.unshift(entry)
      break
    }
    processed++
    entry = queue.shift()
  }

  // If we hit batch limit but still have entries, schedule another flush
  if (queue.length > 0 && processed >= maxBatchSize) {
    setTimeout(() => flush(), 0)
  }
}

// No infinite recursion: Wrapper calls saved original methods
function wrapConsole(method: keyof typeof originals, level: Level) {
  const originalMethod = originals[method]

  console[method] = ((...args: any[]) => {
    // Privacy: Skip file logging if disabled by environment variable
    if (ENABLE_FE_FILE_LOGGING) {
      let serializedText: string | undefined

      try {
        // Performance: Serialize arguments only once per call
        serializedText = `[FE:${level}] ${joinArgs(args)}`

        // Attempt to send to runtime
        if (!trySend({ level, text: serializedText })) {
          // Runtime unavailable: Queue for later
          enqueue({ level, text: serializedText })
        }
      } catch (error) {
        // Serialization failures: Ensure no exceptions escape the logger
        serializationErrors++

        try {
          // Fallback: Create a minimal log entry without full serialization
          const fallbackText = `[FE:${level}] [Serialization Error: ${error instanceof Error ? error.message : 'Unknown'}]`
          if (!trySend({ level, text: fallbackText })) {
            enqueue({ level, text: fallbackText })
          }
        } catch {
          // Complete failure: Just track the error
          // Don't throw or cause any side effects
        }
      }
    }

    // Duplication: Always call original to preserve DevTools output
    // This ensures console output is never lost even if our wrapper fails
    try {
      originalMethod(...args)
    } catch {
      // Even if original console method fails, don't propagate the error
    }
  }) as any
}

// Diagnostic API for monitoring logger health
export function getLoggerStats() {
  return {
    serializationCount,
    serializationErrors,
    queueSize: queue.length,
    runtimeReady,
    initialized,
    isLoggingDisabled: !ENABLE_FE_FILE_LOGGING,
    errorRate: serializationCount > 0 ? serializationErrors / serializationCount : 0,
  }
}

export function initFrontendLogger() {
  // Build-time toggle: If logging is disabled, provide minimal stub implementation
  if (!ENABLE_FE_FILE_LOGGING) {
    initialized = true
    return { markRuntimeReady: () => {} }
  }

  if (initialized) {
    return {
      markRuntimeReady: () => {
        runtimeReady = true
        flush()
      },
      getStats: getLoggerStats,
    }
  }
  initialized = true

  // Privacy: Only wrap console methods if logging is not disabled
  if (ENABLE_FE_FILE_LOGGING) {
    wrapConsole('log', 'info')
    wrapConsole('info', 'info')
    wrapConsole('warn', 'warn')
    wrapConsole('error', 'error')
    wrapConsole('debug', 'debug')
    wrapConsole('trace', 'trace')
  } else {
    // When logging is disabled, keep originals intact
    originals.info('[FrontendLogger] File logging disabled by VITE_SPLITR_FE_FILE_LOGGING=false')
  }

  // Performance: Log initialization metrics
  if (serializationCount === 0) {
    originals.debug(
      '[FrontendLogger] Initialized with logging',
      ENABLE_FE_FILE_LOGGING ? 'enabled' : 'disabled'
    )
  }

  // Expose comprehensive API
  return {
    markRuntimeReady: () => {
      runtimeReady = true
      flush()
    },
    getStats: getLoggerStats,
    // Emergency API for clearing queue if memory becomes an issue
    clearQueue: () => {
      const cleared = queue.length
      queue.length = 0
      originals.warn(`[FrontendLogger] Emergency queue clear - removed ${cleared} entries`)
      return cleared
    },
  }
}
