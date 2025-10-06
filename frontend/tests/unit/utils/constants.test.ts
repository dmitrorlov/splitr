import {
  UI_CONSTANTS,
  API_CONSTANTS,
  VALIDATION_CONSTANTS,
  SCREENS,
  BUTTON_VARIANTS,
  NOTIFICATION_TYPES,
  LOADING_STATES,
  STORAGE_KEYS,
} from '@/utils/constants'

describe('constants', () => {
  describe('UI_CONSTANTS', () => {
    it('should have correct notification durations', () => {
      expect(UI_CONSTANTS.NOTIFICATION_DURATION.SUCCESS).toBe(3000)
      expect(UI_CONSTANTS.NOTIFICATION_DURATION.ERROR).toBe(5000)
      expect(UI_CONSTANTS.NOTIFICATION_DURATION.WARNING).toBe(4000)
      expect(UI_CONSTANTS.NOTIFICATION_DURATION.INFO).toBe(3000)
    })

    it('should have correct debounce delays', () => {
      expect(UI_CONSTANTS.DEBOUNCE_DELAY.SEARCH).toBe(300)
      expect(UI_CONSTANTS.DEBOUNCE_DELAY.INPUT).toBe(150)
    })

    it('should be readonly constants', () => {
      // TypeScript should enforce this, but we can verify the structure exists
      expect(typeof UI_CONSTANTS.NOTIFICATION_DURATION).toBe('object')
      expect(typeof UI_CONSTANTS.DEBOUNCE_DELAY).toBe('object')
    })
  })

  describe('API_CONSTANTS', () => {
    it('should have correct request timeout', () => {
      expect(API_CONSTANTS.REQUEST_TIMEOUT).toBe(10000)
    })

    it('should be readonly constant', () => {
      expect(typeof API_CONSTANTS.REQUEST_TIMEOUT).toBe('number')
    })
  })

  describe('VALIDATION_CONSTANTS', () => {
    describe('NETWORK_NAME', () => {
      it('should have correct length constraints', () => {
        expect(VALIDATION_CONSTANTS.NETWORK_NAME.MIN_LENGTH).toBe(1)
        expect(VALIDATION_CONSTANTS.NETWORK_NAME.MAX_LENGTH).toBe(50)
      })

      it('should have valid pattern for network names', () => {
        const pattern = VALIDATION_CONSTANTS.NETWORK_NAME.PATTERN
        
        // Valid names
        expect(pattern.test('Network1')).toBe(true)
        expect(pattern.test('My-Network')).toBe(true)
        expect(pattern.test('Test Network 123')).toBe(true)
        expect(pattern.test('A')).toBe(true)
        expect(pattern.test('Network-123-Test')).toBe(true)
        
        // Invalid names
        expect(pattern.test('')).toBe(false)
        expect(pattern.test(' Network')).toBe(false) // starts with space
        expect(pattern.test('Network ')).toBe(false) // ends with space
        expect(pattern.test('-Network')).toBe(false) // starts with dash
        expect(pattern.test('Network-')).toBe(false) // ends with dash
        expect(pattern.test('Network!@#')).toBe(false) // special characters
      })
    })

    describe('IP_ADDRESS', () => {
      it('should validate correct IP addresses', () => {
        const pattern = VALIDATION_CONSTANTS.IP_ADDRESS.PATTERN
        
        // Valid IPs
        expect(pattern.test('192.168.1.1')).toBe(true)
        expect(pattern.test('0.0.0.0')).toBe(true)
        expect(pattern.test('255.255.255.255')).toBe(true)
        expect(pattern.test('127.0.0.1')).toBe(true)
        expect(pattern.test('10.0.0.1')).toBe(true)
      })

      it('should reject invalid IP addresses', () => {
        const pattern = VALIDATION_CONSTANTS.IP_ADDRESS.PATTERN
        
        // Invalid IPs
        expect(pattern.test('256.1.1.1')).toBe(false) // > 255
        expect(pattern.test('192.168.1')).toBe(false) // incomplete
        expect(pattern.test('192.168.1.1.1')).toBe(false) // too many parts
        expect(pattern.test('192.168.1.a')).toBe(false) // non-numeric
        expect(pattern.test('192.168.-1.1')).toBe(false) // negative
        expect(pattern.test('')).toBe(false) // empty
        expect(pattern.test('localhost')).toBe(false) // hostname
      })
    })

    describe('HOSTNAME', () => {
      it('should validate correct hostnames', () => {
        const pattern = VALIDATION_CONSTANTS.HOSTNAME.PATTERN
        
        // Valid hostnames
        expect(pattern.test('localhost')).toBe(true)
        expect(pattern.test('example.com')).toBe(true)
        expect(pattern.test('sub.example.com')).toBe(true)
        expect(pattern.test('host-name')).toBe(true)
        expect(pattern.test('server1')).toBe(true)
        expect(pattern.test('a.b.c.d')).toBe(true)
      })

      it('should reject invalid hostnames', () => {
        const pattern = VALIDATION_CONSTANTS.HOSTNAME.PATTERN
        
        // Invalid hostnames
        expect(pattern.test('')).toBe(false) // empty
        expect(pattern.test('-hostname')).toBe(false) // starts with dash
        expect(pattern.test('hostname-')).toBe(false) // ends with dash
        expect(pattern.test('host_name')).toBe(false) // underscore not allowed
        expect(pattern.test('host..name')).toBe(false) // double dot
        expect(pattern.test('.hostname')).toBe(false) // starts with dot
        expect(pattern.test('hostname.')).toBe(false) // ends with dot
      })
    })

    describe('DESCRIPTION', () => {
      it('should have correct max length', () => {
        expect(VALIDATION_CONSTANTS.DESCRIPTION.MAX_LENGTH).toBe(200)
      })
    })
  })

  describe('SCREENS', () => {
    it('should have correct screen identifiers', () => {
      expect(SCREENS.NETWORKS).toBe('networks')
      expect(SCREENS.HOSTS).toBe('hosts')
      expect(SCREENS.NETWORK_HOSTS).toBe('networkHosts')
    })

    it('should have all expected screens', () => {
      const screenValues = Object.values(SCREENS)
      expect(screenValues).toHaveLength(3)
      expect(screenValues).toContain('networks')
      expect(screenValues).toContain('hosts')
      expect(screenValues).toContain('networkHosts')
    })
  })

  describe('BUTTON_VARIANTS', () => {
    it('should have correct button variants', () => {
      expect(BUTTON_VARIANTS.PRIMARY).toBe('primary')
      expect(BUTTON_VARIANTS.SECONDARY).toBe('secondary')
      expect(BUTTON_VARIANTS.DANGER).toBe('danger')
      expect(BUTTON_VARIANTS.GHOST).toBe('ghost')
      expect(BUTTON_VARIANTS.OUTLINE).toBe('outline')
    })

    it('should have all expected variants', () => {
      const variants = Object.values(BUTTON_VARIANTS)
      expect(variants).toHaveLength(5)
      expect(variants).toContain('primary')
      expect(variants).toContain('secondary')
      expect(variants).toContain('danger')
      expect(variants).toContain('ghost')
      expect(variants).toContain('outline')
    })
  })

  describe('NOTIFICATION_TYPES', () => {
    it('should have correct notification types', () => {
      expect(NOTIFICATION_TYPES.SUCCESS).toBe('success')
      expect(NOTIFICATION_TYPES.ERROR).toBe('error')
      expect(NOTIFICATION_TYPES.WARNING).toBe('warning')
      expect(NOTIFICATION_TYPES.INFO).toBe('info')
    })

    it('should have all expected types', () => {
      const types = Object.values(NOTIFICATION_TYPES)
      expect(types).toHaveLength(4)
      expect(types).toContain('success')
      expect(types).toContain('error')
      expect(types).toContain('warning')
      expect(types).toContain('info')
    })
  })

  describe('LOADING_STATES', () => {
    it('should have correct loading states', () => {
      expect(LOADING_STATES.IDLE).toBe('idle')
      expect(LOADING_STATES.LOADING).toBe('loading')
      expect(LOADING_STATES.SUCCESS).toBe('success')
      expect(LOADING_STATES.ERROR).toBe('error')
    })

    it('should have all expected states', () => {
      const states = Object.values(LOADING_STATES)
      expect(states).toHaveLength(4)
      expect(states).toContain('idle')
      expect(states).toContain('loading')
      expect(states).toContain('success')
      expect(states).toContain('error')
    })
  })

  describe('STORAGE_KEYS', () => {
    it('should have correct storage keys', () => {
      expect(STORAGE_KEYS.THEME).toBe('splitr-theme')
      expect(STORAGE_KEYS.NAVIGATION_HISTORY).toBe('splitr-navigation-history')
      expect(STORAGE_KEYS.USER_PREFERENCES).toBe('splitr-user-preferences')
    })

    it('should have all expected keys', () => {
      const keys = Object.values(STORAGE_KEYS)
      expect(keys).toHaveLength(3)
      expect(keys).toContain('splitr-theme')
      expect(keys).toContain('splitr-navigation-history')
      expect(keys).toContain('splitr-user-preferences')
    })

    it('should have consistent key prefix', () => {
      const keys = Object.values(STORAGE_KEYS)
      keys.forEach(key => {
        expect(key.startsWith('splitr-')).toBe(true)
      })
    })
  })

  describe('constant immutability', () => {
    it('should be properly typed as const', () => {
      // These tests verify TypeScript const assertions work correctly
      // The actual immutability is enforced at compile time
      expect(typeof UI_CONSTANTS).toBe('object')
      expect(typeof API_CONSTANTS).toBe('object')
      expect(typeof VALIDATION_CONSTANTS).toBe('object')
      expect(typeof SCREENS).toBe('object')
      expect(typeof BUTTON_VARIANTS).toBe('object')
      expect(typeof NOTIFICATION_TYPES).toBe('object')
      expect(typeof LOADING_STATES).toBe('object')
      expect(typeof STORAGE_KEYS).toBe('object')
    })
  })

  describe('validation pattern integration', () => {
    it('should work together for complete validation', () => {
      // Test that patterns work as expected in combination
      const networkName = 'Test-Network-123'
      const ipAddress = '192.168.1.100'
      const hostname = 'server.example.com'
      
      expect(VALIDATION_CONSTANTS.NETWORK_NAME.PATTERN.test(networkName)).toBe(true)
      expect(VALIDATION_CONSTANTS.IP_ADDRESS.PATTERN.test(ipAddress)).toBe(true)
      expect(VALIDATION_CONSTANTS.HOSTNAME.PATTERN.test(hostname)).toBe(true)
      
      // Verify length constraints
      expect(networkName.length).toBeGreaterThanOrEqual(VALIDATION_CONSTANTS.NETWORK_NAME.MIN_LENGTH)
      expect(networkName.length).toBeLessThanOrEqual(VALIDATION_CONSTANTS.NETWORK_NAME.MAX_LENGTH)
    })
  })
})