package entity

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestIPOrHostnameRegex_ValidIPAddresses(t *testing.T) {
	validIPs := []string{
		"0.0.0.0",
		"127.0.0.1",
		"192.168.1.1",
		"10.0.0.1",
		"172.16.0.1",
		"255.255.255.255",
		"8.8.8.8",
		"1.1.1.1",
		"203.0.113.1",
		"198.51.100.42",
	}

	for _, ip := range validIPs {
		t.Run("valid_ip_"+ip, func(t *testing.T) {
			result := ipOrHostnameRegex.MatchString(ip)
			assert.True(t, result, "IP address %s should be valid", ip)
		})
	}
}

func TestIPOrHostnameRegex_InvalidIPAddresses(t *testing.T) {
	invalidIPs := []string{
		"256.1.1.1",       // octet > 255
		"1.256.1.1",       // octet > 255
		"1.1.256.1",       // octet > 255
		"1.1.1.256",       // octet > 255
		"999.999.999.999", // all octets > 255
		"192.168.1",       // missing octet
		"192.168.1.1.1",   // too many octets
		"192.168..1",      // empty octet
		".192.168.1.1",    // leading dot
		"192.168.1.1.",    // trailing dot
		"192.168.1.-1",    // negative octet
		"192.168.abc.1",   // non-numeric octet
		"192 168 1 1",     // spaces instead of dots
		"",                // empty string
		"192.168.1.1/24",  // CIDR notation
		"192.168.1.1:80",  // with port
	}

	for _, ip := range invalidIPs {
		t.Run("invalid_ip_"+ip, func(t *testing.T) {
			result := ipOrHostnameRegex.MatchString(ip)
			assert.False(t, result, "IP address %s should be invalid", ip)
		})
	}
}

func TestIPOrHostnameRegex_ValidHostnames(t *testing.T) {
	validHostnames := []string{
		"example.com",
		"www.example.com",
		"api.service.example.com",
		"test-server.local",
		"db-01.production.internal",
		"app1.staging.company.co.uk",
		"host123.domain.org",
		"my-app.herokuapp.com",
		"service.k8s.cluster.local",
		"very-long-hostname-that-is-still-valid.example.org",
	}

	for _, hostname := range validHostnames {
		t.Run("valid_hostname_"+hostname, func(t *testing.T) {
			result := ipOrHostnameRegex.MatchString(hostname)
			assert.True(t, result, "Hostname %s should be valid", hostname)
		})
	}
}

func TestIPOrHostnameRegex_InvalidHostnames(t *testing.T) {
	invalidHostnames := []string{
		"-example.com",       // leading hyphen
		"example-.com",       // trailing hyphen in label
		"example..com",       // consecutive dots
		".example.com",       // leading dot
		"example.com.",       // trailing dot
		"example .com",       // space in hostname
		"example@.com",       // invalid character
		"example.c",          // TLD too short
		"example.toolongtld", // TLD too long (>7 chars)
		"",                   // empty string
		"just-a-label",       // missing TLD (no dot)
		"localhost",          // no TLD (no dot)
		"123",                // numeric only
		"example.123invalid", // TLD starts with number
		"exam_ple.com",       // underscore not allowed
		"example.com:8080",   // with port
		"http://example.com", // with protocol
		"a.b.c",              // TLD too short (single char)
	}

	for _, hostname := range invalidHostnames {
		t.Run("invalid_hostname_"+hostname, func(t *testing.T) {
			result := ipOrHostnameRegex.MatchString(hostname)
			assert.False(t, result, "Hostname %s should be invalid", hostname)
		})
	}
}

func TestIPOrHostnameRegex_EdgeCases(t *testing.T) {
	edgeCases := []struct {
		input    string
		expected bool
		desc     string
	}{
		{"localhost.localdomain", false, "localhost with long domain (>7 chars)"},
		{"a1.b2.c3", false, "single char TLD not allowed"},
		{"x.co", true, "minimum valid domain"},
		{"very-long-label-name-that-exceeds-normal-length.example.org", true, "long label name"},
		{"192.168.1.01", true, "IP with leading zero"},
		{"example.travel", true, "valid 6-char TLD"},
		{"sub.example.museum", true, "valid 6-char TLD"},
		{"host.ab", true, "minimum 2-char TLD"},
		{"host.abcdefg", true, "maximum 7-char TLD"},
	}

	for _, tc := range edgeCases {
		t.Run("edge_case_"+tc.desc, func(t *testing.T) {
			result := ipOrHostnameRegex.MatchString(tc.input)
			assert.Equal(t, tc.expected, result, "Edge case %s (%s) should be %v", tc.input, tc.desc, tc.expected)
		})
	}
}

func TestIPOrHostnameRegexString_Constant(t *testing.T) {
	// Test that the constant is not empty and contains expected patterns
	assert.NotEmpty(t, ipOrHostnameRegexString)
	assert.Contains(t, ipOrHostnameRegexString, "25[0-5]")     // IPv4 pattern
	assert.Contains(t, ipOrHostnameRegexString, "[a-zA-Z0-9]") // hostname pattern
}

func TestIPOrHostnameRegex_NotNil(t *testing.T) {
	// Test that the compiled regex is not nil
	assert.NotNil(t, ipOrHostnameRegex)
}

func TestIPOrHostnameRegex_MatchesExpectedPattern(t *testing.T) {
	// Test a few key patterns that should definitely work
	testCases := []struct {
		input    string
		expected bool
	}{
		{"192.168.1.1", true},      // IPv4
		{"google.com", true},       // hostname
		{"invalid..domain", false}, // invalid
		{"256.256.256.256", false}, // invalid IP
	}

	for _, tc := range testCases {
		result := ipOrHostnameRegex.MatchString(tc.input)
		assert.Equal(t, tc.expected, result, "Input %s should match: %v", tc.input, tc.expected)
	}
}

func TestIPOrHostnameRegex_CaseInsensitive(t *testing.T) {
	// Test hostname case variations
	testCases := []string{
		"Example.Com",
		"EXAMPLE.COM",
		"example.COM",
		"Example.com",
	}

	for _, tc := range testCases {
		t.Run("case_test_"+tc, func(t *testing.T) {
			result := ipOrHostnameRegex.MatchString(tc)
			assert.True(t, result, "Hostname %s should be valid regardless of case", tc)
		})
	}
}
