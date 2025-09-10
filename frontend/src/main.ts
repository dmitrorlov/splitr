import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { initFrontendLogger } from './lib/frontendLogger' // add this import first
import './style.css'
import { LogError } from '../wailsjs/runtime/runtime'

// Early startup log for validation
console.log('VALIDATION: Early startup log at top of main.ts')

// Initialize the FE logger ASAP to capture early logs
const feLogger = initFrontendLogger()

// Global error handler
window.addEventListener('error', event => {
  console.error('Global error:', event.error)
})

window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason)
})

// Wait for Wails runtime to be ready
function waitForWailsRuntime() {
  return new Promise<void>(resolve => {
    let attempts = 0
    const maxAttempts = 100 // 10 seconds max wait

    if (window.go) {
      console.log('Wails runtime already available')
      resolve()
      return
    }

    const checkRuntime = () => {
      attempts++
      if (window.go) {
        console.log('Wails runtime is now available')
        resolve()
      } else if (attempts >= maxAttempts) {
        console.error('Wails runtime not available after maximum attempts')
        resolve() // Continue anyway
      } else {
        console.log(`Waiting for Wails runtime... (attempt ${attempts})`)
        setTimeout(checkRuntime, 100)
      }
    }

    checkRuntime()
  })
}

// Initialize app after runtime is ready
waitForWailsRuntime().then(() => {
  // Let the logger flush buffered entries to the rotating file
  feLogger.markRuntimeReady()

  try {
    const app = createApp(App)

    // Initialize Pinia store
    const pinia = createPinia()
    app.use(pinia)

    app.mount('#app')

    console.log('Vue app initialized successfully with Pinia store')
  } catch (error) {
    console.error('Error mounting Vue app:', error)
    LogError(`Frontend: Failed to initialize Vue app: ${error}`)
  }
})
