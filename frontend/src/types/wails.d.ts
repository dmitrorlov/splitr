declare global {
  interface Window {
    go?: {
      main?: {
        App?: {
          AddHost: (arg1: string, arg2: string) => Promise<any>
          AddNetwork: (arg1: string) => Promise<any>
          AddNetworkHost: (arg1: number, arg2: string, arg3: string) => Promise<any>
          DeleteHost: (arg1: number) => Promise<any>
          DeleteNetwork: (arg1: number) => Promise<any>
          DeleteNetworkHost: (arg1: number) => Promise<any>
          ExportNetworkHosts: (arg1: number) => Promise<any>
          ImportNetworkHosts: (arg1: number, arg2: string) => Promise<any>
          ListHosts: (arg1: string) => Promise<any>
          ListNetworkHosts: (arg1: number, arg2: string) => Promise<any>
          ListNetworks: (arg1: string) => Promise<any>
          ListVPNServices: () => Promise<any>
          SaveFileWithDialog: (arg1: string, arg2: string) => Promise<any>
          SyncNetworkHostSetup: (arg1: number) => Promise<any>
          ResetNetworkHostSetup: (arg1: number) => Promise<any>
        }
      }
      app?: {
        App?: {
          AddHost: (arg1: string, arg2: string) => Promise<any>
          AddNetwork: (arg1: string) => Promise<any>
          AddNetworkHost: (arg1: number, arg2: string, arg3: string) => Promise<any>
          DeleteHost: (arg1: number) => Promise<any>
          DeleteNetwork: (arg1: number) => Promise<any>
          DeleteNetworkHost: (arg1: number) => Promise<any>
          ExportNetworkHosts: (arg1: number) => Promise<any>
          ImportNetworkHosts: (arg1: number, arg2: string) => Promise<any>
          ListHosts: (arg1: string) => Promise<any>
          ListNetworkHosts: (arg1: number, arg2: string) => Promise<any>
          ListNetworks: (arg1: string) => Promise<any>
          ListVPNServices: () => Promise<any>
          SaveFileWithDialog: (arg1: string, arg2: string) => Promise<any>
          SyncNetworkHostSetup: (arg1: number) => Promise<any>
          ResetNetworkHostSetup: (arg1: number) => Promise<any>
        }
      }
    }
    runtime?: {
      // Logging functions
      LogPrint?: (message: string) => void
      LogTrace?: (message: string) => void
      LogDebug?: (message: string) => void
      LogInfo?: (message: string) => void
      LogWarning?: (message: string) => void
      LogError?: (message: string) => void
      LogFatal?: (message: string) => void

      // Event functions
      EventsEmit?: (eventName: string, ...data: any[]) => void
      EventsOn?: (eventName: string, callback: (...data: any[]) => void) => () => void
      EventsOnMultiple?: (
        eventName: string,
        callback: (...data: any[]) => void,
        maxCallbacks: number
      ) => () => void
      EventsOnce?: (eventName: string, callback: (...data: any[]) => void) => () => void
      EventsOff?: (eventName: string, ...additionalEventNames: string[]) => void
      EventsOffAll?: () => void

      // Window functions
      WindowReload?: () => void
      WindowReloadApp?: () => void
      WindowSetAlwaysOnTop?: (b: boolean) => void
      WindowSetSystemDefaultTheme?: () => void
      WindowSetLightTheme?: () => void
      WindowSetDarkTheme?: () => void
      WindowCenter?: () => void
      WindowSetTitle?: (title: string) => void
      WindowFullscreen?: () => void
      WindowUnfullscreen?: () => void
      WindowIsFullscreen?: () => Promise<boolean>
      WindowSetSize?: (width: number, height: number) => void
      WindowGetSize?: () => Promise<{ w: number; h: number }>
      WindowSetMaxSize?: (width: number, height: number) => void
      WindowSetMinSize?: (width: number, height: number) => void
      WindowSetPosition?: (x: number, y: number) => void
      WindowGetPosition?: () => Promise<{ x: number; y: number }>
      WindowHide?: () => void
      WindowShow?: () => void
      WindowMaximise?: () => void
      WindowToggleMaximise?: () => void
      WindowUnmaximise?: () => void
      WindowIsMaximised?: () => Promise<boolean>
      WindowMinimise?: () => void
      WindowUnminimise?: () => void
      WindowIsMinimised?: () => Promise<boolean>
      WindowIsNormal?: () => Promise<boolean>
      WindowSetBackgroundColour?: (R: number, G: number, B: number, A: number) => void

      // Screen functions
      ScreenGetAll?: () => Promise<
        Array<{
          isCurrent: boolean
          isPrimary: boolean
          width: number
          height: number
        }>
      >

      // Browser functions
      BrowserOpenURL?: (url: string) => void

      // Environment and application functions
      Environment?: () => Promise<{
        buildType: string
        platform: string
        arch: string
      }>
      Quit?: () => void
      Hide?: () => void
      Show?: () => void

      // Clipboard functions
      ClipboardGetText?: () => Promise<string>
      ClipboardSetText?: (text: string) => Promise<boolean>

      // File drop functions
      OnFileDrop?: (
        callback: (x: number, y: number, paths: string[]) => void,
        useDropTarget: boolean
      ) => void
      OnFileDropOff?: () => void
      CanResolveFilePaths?: () => boolean
      ResolveFilePaths?: (files: File[]) => void
    }
  }
}

export {}
