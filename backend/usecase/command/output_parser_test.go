package command

import (
	"fmt"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewOutputParser(t *testing.T) {
	parser := newOutputParser()

	assert.NotNil(t, parser)
	assert.IsType(t, &outputParser{}, parser)
}

func TestOutputParser_ParseVPNName(t *testing.T) {
	parser := newOutputParser()

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "valid VPN name with quotes",
			input:    `"MyVPN"`,
			expected: "MyVPN",
		},
		{
			name:     "valid VPN name with special characters",
			input:    `"Office-VPN_2023"`,
			expected: "Office-VPN_2023",
		},
		{
			name:     "valid VPN name with spaces",
			input:    `"My Work VPN"`,
			expected: "My Work VPN",
		},
		{
			name:     "VPN name with numbers and symbols",
			input:    `"VPN-123@Company"`,
			expected: "VPN-123@Company",
		},
		{
			name:     "empty VPN name",
			input:    `""`,
			expected: "",
		},
		{
			name:     "no quotes",
			input:    "MyVPN",
			expected: "",
		},
		{
			name:     "single quote",
			input:    `"MyVPN`,
			expected: "",
		},
		{
			name:     "no match - different pattern",
			input:    "VPN: MyVPN",
			expected: "",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "multiple quotes",
			input:    `"First" "Second"`,
			expected: "First",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parser.parseVPNName(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestOutputParser_ParseInterfaceName(t *testing.T) {
	parser := newOutputParser()

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "valid interface name",
			input:    "Device: eth0",
			expected: "eth0",
		},
		{
			name:     "valid wireless interface",
			input:    "Device: wlan0",
			expected: "wlan0",
		},
		{
			name:     "valid interface with numbers",
			input:    "Device: eth123",
			expected: "eth123",
		},
		{
			name:     "valid VPN interface",
			input:    "Device: tun0",
			expected: "tun0",
		},
		{
			name:     "single character interface",
			input:    "Device: a",
			expected: "a",
		},
		{
			name:     "no match - missing Device prefix",
			input:    "eth0",
			expected: "",
		},
		{
			name:     "no match - wrong format",
			input:    "Interface: eth0",
			expected: "",
		},
		{
			name:     "no match - missing colon",
			input:    "Device eth0",
			expected: "",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "interface name with spaces after colon",
			input:    "Device:  eth0",
			expected: "",
		},
		{
			name:     "interface name with special characters - matches word part",
			input:    "Device: eth-0",
			expected: "eth",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parser.parseInterfaceName(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestOutputParser_ParseNetworkServiceName(t *testing.T) {
	parser := newOutputParser()

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "valid network service",
			input:    "(1) Wi-Fi",
			expected: "Wi-Fi",
		},
		{
			name:     "valid ethernet service",
			input:    "(2) Ethernet",
			expected: "Ethernet",
		},
		{
			name:     "service with special characters",
			input:    "(3) USB 10/100/1000 LAN",
			expected: "USB 10/100/1000 LAN",
		},
		{
			name:     "service with multiple numbers",
			input:    "(10) Bluetooth PAN",
			expected: "Bluetooth PAN",
		},
		{
			name:     "service with hyphen",
			input:    "(5) Thunderbolt-Bridge",
			expected: "Thunderbolt-Bridge",
		},
		{
			name:     "no match - missing parentheses",
			input:    "1 Wi-Fi",
			expected: "",
		},
		{
			name:     "no match - wrong format",
			input:    "[1] Wi-Fi",
			expected: "",
		},
		{
			name:     "no match - missing space",
			input:    "(1)Wi-Fi",
			expected: "",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "service with only parentheses",
			input:    "(1) ",
			expected: "",
		},
		{
			name:     "service name with numbers",
			input:    "(4) Network Interface 123",
			expected: "Network Interface 123",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parser.parseNetworkServiceName(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestOutputParser_ParseSubnetMask(t *testing.T) {
	parser := newOutputParser()

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "valid subnet mask /24",
			input:    "Subnet mask: 255.255.255.0",
			expected: "255.255.255.0",
		},
		{
			name:     "valid subnet mask /16",
			input:    "Subnet mask: 255.255.0.0",
			expected: "255.255.0.0",
		},
		{
			name:     "valid subnet mask /8",
			input:    "Subnet mask: 255.0.0.0",
			expected: "255.0.0.0",
		},
		{
			name:     "valid subnet mask custom",
			input:    "Subnet mask: 255.255.240.0",
			expected: "255.255.240.0",
		},
		{
			name:     "all zeros mask",
			input:    "Subnet mask: 0.0.0.0",
			expected: "0.0.0.0",
		},
		{
			name:     "three digit numbers",
			input:    "Subnet mask: 192.168.100.255",
			expected: "192.168.100.255",
		},
		{
			name:     "single digit numbers",
			input:    "Subnet mask: 1.2.3.4",
			expected: "1.2.3.4",
		},
		{
			name:     "no match - missing prefix",
			input:    "255.255.255.0",
			expected: "",
		},
		{
			name:     "no match - wrong prefix",
			input:    "Netmask: 255.255.255.0",
			expected: "",
		},
		{
			name:     "no match - missing colon",
			input:    "Subnet mask 255.255.255.0",
			expected: "",
		},
		{
			name:     "no match - invalid IP format",
			input:    "Subnet mask: 255.255.255",
			expected: "",
		},
		{
			name:     "matches large numbers - regex accepts 1-3 digits",
			input:    "Subnet mask: 999.999.999.999",
			expected: "999.999.999.999",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parser.parseSubnetMask(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestOutputParser_ParseRouter(t *testing.T) {
	parser := newOutputParser()

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "valid router IP",
			input:    "Router: 192.168.1.1",
			expected: "192.168.1.1",
		},
		{
			name:     "valid router IP different subnet",
			input:    "Router: 10.0.0.1",
			expected: "10.0.0.1",
		},
		{
			name:     "valid router IP with high numbers",
			input:    "Router: 172.16.254.1",
			expected: "172.16.254.1",
		},
		{
			name:     "router with all zeros",
			input:    "Router: 0.0.0.0",
			expected: "0.0.0.0",
		},
		{
			name:     "router with single digits",
			input:    "Router: 1.2.3.4",
			expected: "1.2.3.4",
		},
		{
			name:     "router with three digit numbers",
			input:    "Router: 192.168.100.254",
			expected: "192.168.100.254",
		},
		{
			name:     "no match - missing prefix",
			input:    "192.168.1.1",
			expected: "",
		},
		{
			name:     "no match - wrong prefix",
			input:    "Gateway: 192.168.1.1",
			expected: "",
		},
		{
			name:     "no match - missing colon",
			input:    "Router 192.168.1.1",
			expected: "",
		},
		{
			name:     "no match - invalid IP format",
			input:    "Router: 192.168.1",
			expected: "",
		},
		{
			name:     "matches large numbers - regex accepts 1-3 digits",
			input:    "Router: 999.999.999.999",
			expected: "999.999.999.999",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "router with extra spaces",
			input:    "Router:  192.168.1.1",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parser.parseRouter(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestOutputParser_EdgeCases(t *testing.T) {
	parser := newOutputParser()

	t.Run("very long strings", func(t *testing.T) {
		longVPNName := `"` + string(make([]byte, 1000)) + `"`
		result := parser.parseVPNName(longVPNName)
		assert.Equal(t, string(make([]byte, 1000)), result)
	})

	t.Run("unicode characters in VPN name", func(t *testing.T) {
		unicodeVPN := `"VPN-Café-网络"`
		result := parser.parseVPNName(unicodeVPN)
		assert.Equal(t, "VPN-Café-网络", result)
	})

	t.Run("all methods with nil input handling", func(t *testing.T) {
		// Test that empty strings don't cause panics
		assert.NotPanics(t, func() {
			parser.parseVPNName("")
		})
		assert.NotPanics(t, func() {
			parser.parseInterfaceName("")
		})
		assert.NotPanics(t, func() {
			parser.parseNetworkServiceName("")
		})
		assert.NotPanics(t, func() {
			parser.parseSubnetMask("")
		})
		assert.NotPanics(t, func() {
			parser.parseRouter("")
		})
	})
}

func TestOutputParser_CombinedScenarios(t *testing.T) {
	parser := newOutputParser()

	t.Run("realistic network output parsing", func(t *testing.T) {
		// Simulate a realistic network configuration output
		mockOutput := []string{
			`VPN Connection: "Corporate-VPN"`,
			`Device: eth0`,
			`(1) Wi-Fi`,
			`Subnet mask: 255.255.255.0`,
			`Router: 192.168.1.1`,
			`Some other line that shouldn't match`,
			`Device: wlan0`,
			`(2) Ethernet`,
			`Router: 10.0.0.1`,
		}

		// Test each line with appropriate parser
		assert.Equal(t, "Corporate-VPN", parser.parseVPNName(mockOutput[0]))
		assert.Equal(t, "eth0", parser.parseInterfaceName(mockOutput[1]))
		assert.Equal(t, "Wi-Fi", parser.parseNetworkServiceName(mockOutput[2]))
		assert.Equal(t, "255.255.255.0", parser.parseSubnetMask(mockOutput[3]))
		assert.Equal(t, "192.168.1.1", parser.parseRouter(mockOutput[4]))
		assert.Empty(t, parser.parseVPNName(mockOutput[5]))
		assert.Equal(t, "wlan0", parser.parseInterfaceName(mockOutput[6]))
		assert.Equal(t, "Ethernet", parser.parseNetworkServiceName(mockOutput[7]))
		assert.Equal(t, "10.0.0.1", parser.parseRouter(mockOutput[8]))
	})

	t.Run("mixed valid and invalid patterns", func(t *testing.T) {
		testCases := []struct {
			line    string
			vpnName string
			intName string
			svcName string
			mask    string
			router  string
		}{
			{
				line:    `"TestVPN" Device: eth0 (1) Service`,
				vpnName: "TestVPN",
				intName: "eth0",
				svcName: "Service",
				mask:    "",
				router:  "",
			},
			{
				line:    `Subnet mask: 255.255.0.0 Router: 192.168.1.1`,
				vpnName: "",
				intName: "",
				svcName: "",
				mask:    "255.255.0.0",
				router:  "192.168.1.1",
			},
		}

		for i, tc := range testCases {
			t.Run(fmt.Sprintf("case_%d", i), func(t *testing.T) {
				assert.Equal(t, tc.vpnName, parser.parseVPNName(tc.line))
				assert.Equal(t, tc.intName, parser.parseInterfaceName(tc.line))
				assert.Equal(t, tc.svcName, parser.parseNetworkServiceName(tc.line))
				assert.Equal(t, tc.mask, parser.parseSubnetMask(tc.line))
				assert.Equal(t, tc.router, parser.parseRouter(tc.line))
			})
		}
	})
}

func TestOutputParser_BoundaryConditions(t *testing.T) {
	parser := newOutputParser()

	t.Run("IP address boundary conditions", func(t *testing.T) {
		tests := []struct {
			name     string
			input    string
			expected string
		}{
			{
				name:     "minimum valid IP for subnet",
				input:    "Subnet mask: 0.0.0.0",
				expected: "0.0.0.0",
			},
			{
				name:     "maximum valid IP for subnet",
				input:    "Subnet mask: 255.255.255.255",
				expected: "255.255.255.255",
			},
			{
				name:     "minimum valid IP for router",
				input:    "Router: 0.0.0.0",
				expected: "0.0.0.0",
			},
			{
				name:     "maximum valid IP for router",
				input:    "Router: 255.255.255.255",
				expected: "255.255.255.255",
			},
			{
				name:     "four digit number - should not match",
				input:    "Subnet mask: 1000.1.1.1",
				expected: "",
			},
			{
				name:     "negative number - should not match",
				input:    "Router: -1.1.1.1",
				expected: "",
			},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				if strings.Contains(tt.input, "Subnet mask:") {
					result := parser.parseSubnetMask(tt.input)
					assert.Equal(t, tt.expected, result)
				} else if strings.Contains(tt.input, "Router:") {
					result := parser.parseRouter(tt.input)
					assert.Equal(t, tt.expected, result)
				}
			})
		}
	})

	t.Run("regex minimum length validation", func(t *testing.T) {
		// Test that the minimum length constants are working correctly
		// These should all return empty strings due to insufficient match groups

		// Force a scenario where regex would match but length check fails
		// This is tricky since the regexes are designed to work with minimum lengths
		// But we can test edge cases where the pattern might partially match

		shortTests := []struct {
			method func(string) string
			input  string
		}{
			{parser.parseVPNName, `"`},               // Incomplete quote
			{parser.parseInterfaceName, "Device:"},   // Missing interface name
			{parser.parseNetworkServiceName, "("},    // Incomplete parentheses
			{parser.parseSubnetMask, "Subnet mask:"}, // Missing IP
			{parser.parseRouter, "Router:"},          // Missing IP
		}

		for i, test := range shortTests {
			t.Run(fmt.Sprintf("short_input_%d", i), func(t *testing.T) {
				result := test.method(test.input)
				assert.Empty(t, result)
			})
		}
	})
}
