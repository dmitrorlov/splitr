# Frontend Testing Plan

## Overview

This document outlines a comprehensive testing strategy for the Splitr frontend application built with Vue 3, TypeScript, and Vite. The plan covers unit tests, integration tests, and end-to-end tests to ensure robust code coverage and application reliability.

## Current Frontend Architecture

### Technology Stack
- **Framework**: Vue 3 with Composition API
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Pinia
- **UI Framework**: Tailwind CSS with Headless UI
- **Icons**: Heroicons

### Project Structure
```
frontend/src/
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── features/              # Feature-specific components
│   │   ├── hosts/
│   │   ├── networks/
│   │   └── network-hosts/
│   ├── layout/
│   └── screen components
├── composables/               # Vue composables
├── stores/                    # Pinia stores
├── services/                  # API services
├── types/                     # TypeScript types
├── utils/                     # Utility functions
└── lib/                       # Libraries
```

## Testing Strategy

### 1. Testing Framework Setup

**Primary Testing Stack:**
- **Test Runner**: Vitest (for unit tests)
- **Component Testing**: Vue Test Utils + @vue/test-utils
- **Mocking**: Vitest built-in mocks + MSW (Mock Service Worker)
- **Coverage**: Vitest coverage (c8/v8)

**Installation Requirements:**
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vue/test-utils": "^2.4.0",
    "@vitest/ui": "^1.0.0",
    "jsdom": "^23.0.0",
    "msw": "^2.0.0",
    "@types/jsdom": "^21.1.0",
    "c8": "^8.0.0"
  }
}
```

### 2. Test Categories and Priorities

#### Priority 1: Core Functionality (Unit Tests)
**Target Coverage: 90%+**

##### A. Pinia Stores (`/stores`)
- [ ] **hosts.ts** - Host management state
  - Actions: `fetchHosts`, `createHost`, `updateHost`, `deleteHost`
  - Getters: `searchFilteredHosts`, `sortedHosts`
  - State mutations and reactivity
- [ ] **networks.ts** - Network management state
  - Actions: `fetchNetworks`, `createNetwork`, `updateNetwork`, `deleteNetwork`
  - Getters: `searchFilteredNetworks`, `sortedNetworks`
- [ ] **networkHosts.ts** - Network-host associations
  - Actions: `fetchNetworkHosts`, `createAssociation`, `updateAssociation`, `deleteAssociation`
  - Complex state management for relationships
- [ ] **navigation.ts** - Navigation state
  - Route management and navigation guards
- [ ] **ui.ts** - UI state management
  - Modal states, loading states, notifications

##### B. Composables (`/composables`)
- [ ] **useApi.ts** - API integration composable
  - HTTP client wrapper functionality
  - Error handling mechanisms
- [ ] **useConfirmDialog.ts** - Confirmation dialog management
  - Dialog state management
  - Confirmation flow logic
- [ ] **useFormValidation.ts** - Form validation logic
  - Validation rules and error handling
  - Form state management
- [ ] **useLoading.ts** - Loading state management
  - Loading indicators and state tracking
- [ ] **useNotifications.ts** - Notification system
  - Message queuing and display logic
- [ ] **useSearch.ts** - Search functionality
  - Search algorithms and filtering logic

##### C. Services (`/services`)
- [ ] **api.ts** - Core API service
  - HTTP request/response handling
  - Error transformation
- [ ] **hosts.service.ts** - Host-specific API calls
- [ ] **networks.service.ts** - Network-specific API calls
- [ ] **networkHosts.service.ts** - Network-host API calls

##### D. Utilities (`/utils`)
- [ ] **formatters.ts** - Data formatting functions
- [ ] **constants.ts** - Application constants
- [ ] **index.ts** - Utility exports

#### Priority 2: UI Components (Component Tests)
**Target Coverage: 85%+**

##### A. Base UI Components (`/components/ui`)
- [ ] **Button.vue**
  - Props validation (variant, size, disabled)
  - Event emissions (click)
  - Slot content rendering
  - Accessibility attributes
- [ ] **Input.vue**
  - Props validation (type, placeholder, validation)
  - v-model binding
  - Validation state display
  - Error message rendering
- [ ] **Select.vue**
  - Options rendering
  - Selection behavior
  - v-model binding
  - Accessibility (ARIA labels)
- [ ] **Modal.vue**
  - Open/close functionality
  - ESC key handling
  - Backdrop click handling
  - Focus management
- [ ] **ConfirmDialog.vue**
  - Confirmation flow
  - Action button behaviors
  - Message display
- [ ] **Card.vue**
  - Content slot rendering
  - Styling variants
- [ ] **SearchInput.vue**
  - Search input behavior
  - Debouncing functionality
  - Clear button functionality

##### B. Feature Components (`/components/features`)

**Hosts Feature:**
- [ ] **HostCard.vue**
  - Host data display
  - Action button behaviors
  - Status indicators
- [ ] **HostForm.vue**
  - Form validation
  - Data binding
  - Submit/cancel behaviors
  - Error state handling
- [ ] **HostList.vue**
  - List rendering
  - Empty state handling
  - Loading state display

**Networks Feature:**
- [ ] **NetworkCard.vue**
  - Network data display
  - Action buttons
  - Host count display
- [ ] **NetworkForm.vue**
  - Form validation
  - CIDR validation
  - Submit handling
- [ ] **NetworkList.vue**
  - List rendering
  - Filtering integration

**Network-Hosts Feature:**
- [ ] **NetworkHostCard.vue**
  - Association data display
  - Status indicators
  - Action buttons
- [ ] **NetworkHostForm.vue**
  - Complex form validation
  - Host-network association logic
  - Configuration options
- [ ] **NetworkHostList.vue**
  - Association list display
  - Bulk operations

##### C. Screen Components
- [ ] **HostsScreen.vue**
  - Component integration
  - Data flow
  - User interactions
- [ ] **NetworksScreen.vue**
  - Network management flow
  - Search integration
- [ ] **NetworkHostsScreen.vue**
  - Complex relationship management
  - Import/export integration
- [ ] **NetworkHostsImportExport.vue**
  - File upload/download
  - Data validation
  - Error handling



## Implementation Phases

### Phase 1: Foundation Setup
1. **Configure Testing Environment**
   - Install testing dependencies
   - Configure Vitest and Vue Test Utils
   - Set up test file structure
   - Configure coverage reporting

2. **Create Testing Utilities**
   - Mock factories for entities
   - Test helpers for Vue components
   - API mocking setup with MSW
   - Custom render utilities

### Phase 2: Core Logic Testing
1. **Pinia Stores Testing**
   - Test all store actions and getters
   - Verify state mutations
   - Test error handling

2. **Composables Testing**
   - Test all custom composables
   - Verify reactivity and cleanup
   - Test error scenarios

3. **Services Testing**
   - Mock API calls
   - Test request/response handling
   - Verify error transformation

### Phase 3: Component Testing
1. **UI Components**
   - Test base components thoroughly
   - Verify props and events
   - Test accessibility features

2. **Feature Components**
   - Test complex components
   - Verify data binding
   - Test user interactions

## Test File Structure

```
frontend/
├── src/
│   └── ... (existing code)
├── tests/
│   ├── unit/
│   │   ├── stores/
│   │   │   ├── hosts.test.ts
│   │   │   ├── networks.test.ts
│   │   │   ├── networkHosts.test.ts
│   │   │   ├── navigation.test.ts
│   │   │   └── ui.test.ts
│   │   ├── composables/
│   │   │   ├── useApi.test.ts
│   │   │   ├── useConfirmDialog.test.ts
│   │   │   ├── useFormValidation.test.ts
│   │   │   ├── useLoading.test.ts
│   │   │   ├── useNotifications.test.ts
│   │   │   └── useSearch.test.ts
│   │   ├── services/
│   │   │   ├── api.test.ts
│   │   │   ├── hosts.service.test.ts
│   │   │   ├── networks.service.test.ts
│   │   │   └── networkHosts.service.test.ts
│   │   └── utils/
│   │       ├── formatters.test.ts
│   │       └── constants.test.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.test.ts
│   │   │   ├── Input.test.ts
│   │   │   ├── Select.test.ts
│   │   │   ├── Modal.test.ts
│   │   │   ├── ConfirmDialog.test.ts
│   │   │   ├── Card.test.ts
│   │   │   └── SearchInput.test.ts
│   │   ├── features/
│   │   │   ├── hosts/
│   │   │   │   ├── HostCard.test.ts
│   │   │   │   ├── HostForm.test.ts
│   │   │   │   └── HostList.test.ts
│   │   │   ├── networks/
│   │   │   │   ├── NetworkCard.test.ts
│   │   │   │   ├── NetworkForm.test.ts
│   │   │   │   └── NetworkList.test.ts
│   │   │   └── network-hosts/
│   │   │       ├── NetworkHostCard.test.ts
│   │   │       ├── NetworkHostForm.test.ts
│   │   │       └── NetworkHostList.test.ts
│   │   └── screens/
│   │       ├── HostsScreen.test.ts
│   │       ├── NetworksScreen.test.ts
│   │       ├── NetworkHostsScreen.test.ts
│   │       └── NetworkHostsImportExport.test.ts
│   ├── __mocks__/
│   │   ├── wails.ts
│   │   ├── entities.ts
│   │   └── api-responses.ts
│   └── setup/
│       ├── test-setup.ts
│       ├── msw-setup.ts
│       └── vitest.config.ts
```

## Configuration Files

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup/test-setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'wailsjs/',
        '**/*.d.ts',
        'src/types/',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    globals: true,
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
```

### Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

## Testing Standards and Best Practices

### 1. Naming Conventions
- Test files: `*.test.ts` for unit/integration, `*.spec.ts` for E2E
- Test descriptions: Use "should" statements
- Test groups: Organize with `describe` blocks

### 2. Test Structure (AAA Pattern)
```typescript
describe('ComponentName', () => {
  it('should do something when condition is met', () => {
    // Arrange
    const props = { ... }
    
    // Act
    const wrapper = mount(Component, { props })
    
    // Assert
    expect(wrapper.text()).toContain('expected text')
  })
})
```

### 3. Mocking Guidelines
- Mock external dependencies (APIs, Wails functions)
- Use real implementations for internal modules when possible
- Create reusable mock factories

### 4. Coverage Goals
- **Unit Tests**: 90%+ coverage
- **Critical paths**: 100% coverage
- **UI Components**: 85%+ coverage

This comprehensive testing plan ensures the Splitr frontend will have robust unit and component test coverage, improving code quality, reducing bugs, and enabling confident refactoring and feature development.