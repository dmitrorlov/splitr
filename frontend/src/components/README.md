# Frontend Components Structure

This directory contains the refactored Vue.js components for the Splitr desktop application. The application has been restructured to use separate screens with proper navigation instead of a single-file approach.

## Components Overview

### 1. NetworksScreen.vue
- **Purpose**: Display and manage VPN networks
- **Features**:
  - List all available networks in a card-based grid layout
  - Add new networks via VPN service selection
  - Delete existing networks
  - Navigate to network hosts by clicking on a network card
- **Navigation**: Primary screen accessible via top navigation tabs

### 2. NetworkHostsScreen.vue
- **Purpose**: Manage hosts for a specific network
- **Features**:
  - Display hosts configured for the selected network
  - Add hosts to the network (manual input or select from existing hosts)
  - Remove hosts from the network
  - Sync network host setup
  - Back navigation to networks list
- **Navigation**: Accessed by clicking on a network card in NetworksScreen

### 3. HostsScreen.vue
- **Purpose**: Manage standalone hosts
- **Features**:
  - Display all standalone hosts in a card-based grid layout
  - Add new hosts with address and description
  - Delete existing hosts
- **Navigation**: Primary screen accessible via top navigation tabs

## Navigation Flow

```
Networks Screen (Primary)
├── Click network card → Network Hosts Screen
│   └── Back button → Networks Screen
└── Top nav → Hosts Screen (Primary)
```

## Key Improvements

### Separation of Concerns
- Each screen is now a separate component with its own state management
- Better maintainability and testability
- Clear separation between network management and host management

### Enhanced User Experience
- Dedicated screens instead of cramped side-by-side layouts
- Consistent card-based UI across all screens
- Clear navigation patterns with back buttons and breadcrumbs
- Better responsive design for different screen sizes

### State Management
- Each component manages its own data loading and state
- Centralized error and success message handling in main App.vue
- Proper event emission for cross-component communication

## Event System

All components emit standardized events:
- `error`: For error messages
- `success`: For success messages
- Custom navigation events handled by parent App.vue

## Styling
- Consistent Tailwind CSS classes across all components
- Responsive grid layouts (1 column on mobile, 2 on tablet, 3 on desktop)
- Consistent color scheme and spacing
- Hover effects and transitions for better interactivity

## API Integration
Each component handles its own API calls:
- NetworksScreen: ListNetworks, AddNetwork, DeleteNetwork, ListVPNServices
- NetworkHostsScreen: ListNetworkHosts, AddNetworkHost, DeleteNetworkHost, SyncNetworkHostSetup
- HostsScreen: ListHosts, AddHost, DeleteHost