package entity

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewHost_ValidAddresses(t *testing.T) {
	tests := []struct {
		name        string
		address     string
		description string
	}{
		{
			name:        "valid IPv4 address",
			address:     "192.168.1.1",
			description: "Router",
		},
		{
			name:        "valid IPv4 address with empty description",
			address:     "10.0.0.1",
			description: "",
		},
		{
			name:        "valid hostname",
			address:     "example.com",
			description: "Example website",
		},
		{
			name:        "valid hostname with subdomain",
			address:     "api.example.com",
			description: "API server",
		},
		{
			name:        "valid hostname with hyphen",
			address:     "my-server.example.com",
			description: "My server",
		},
		{
			name:        "edge case IP - all zeros",
			address:     "0.0.0.0",
			description: "All interfaces",
		},
		{
			name:        "edge case IP - max values",
			address:     "255.255.255.255",
			description: "Broadcast",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			host, err := NewHost(tt.address, tt.description)

			require.NoError(t, err)
			require.NotNil(t, host)

			assert.Equal(t, tt.address, host.Address)
			assert.Equal(t, uint64(0), host.ID)           // Should be zero for new host
			assert.False(t, host.CreatedAt.Time.IsZero()) // Should have timestamp

			if tt.description == "" {
				assert.Nil(t, host.Description)
			} else {
				require.NotNil(t, host.Description)
				assert.Equal(t, tt.description, *host.Description)
			}
		})
	}
}

func TestNewHost_InvalidAddresses(t *testing.T) {
	tests := []struct {
		name    string
		address string
	}{
		{
			name:    "empty address",
			address: "",
		},
		{
			name:    "invalid IPv4 - too many octets",
			address: "192.168.1.1.1",
		},
		{
			name:    "invalid IPv4 - octet too large",
			address: "192.168.1.256",
		},
		{
			name:    "invalid IPv4 - negative octet",
			address: "192.168.1.-1",
		},
		{
			name:    "invalid IPv4 - non-numeric",
			address: "192.168.abc.1",
		},
		{
			name:    "invalid hostname - starts with hyphen",
			address: "-invalid.com",
		},
		{
			name:    "invalid hostname - ends with hyphen",
			address: "invalid-.com",
		},
		{
			name:    "invalid hostname - consecutive dots",
			address: "invalid..com",
		},
		{
			name:    "invalid hostname - starts with dot",
			address: ".invalid.com",
		},
		{
			name:    "invalid hostname - ends with dot",
			address: "invalid.com.",
		},
		{
			name:    "space in address",
			address: "192.168.1.1 ",
		},
		{
			name:    "special characters",
			address: "192.168.1.1@",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			host, err := NewHost(tt.address, "test description")

			require.Error(t, err)
			assert.Nil(t, host)
			assert.Equal(t, "invalid address", err.Error())
		})
	}
}

func TestHost_Fields(t *testing.T) {
	host := Host{
		ID:          123,
		Address:     "192.168.1.100",
		Description: stringPtr("Test server"),
		CreatedAt:   NewTimestamp(),
	}

	assert.Equal(t, uint64(123), host.ID)
	assert.Equal(t, "192.168.1.100", host.Address)
	require.NotNil(t, host.Description)
	assert.Equal(t, "Test server", *host.Description)
	assert.False(t, host.CreatedAt.Time.IsZero())
}

func TestHost_NilDescription(t *testing.T) {
	host := Host{
		ID:          456,
		Address:     "example.com",
		Description: nil,
	}

	assert.Equal(t, uint64(456), host.ID)
	assert.Equal(t, "example.com", host.Address)
	assert.Nil(t, host.Description)
}

// Helper function to create a string pointer.
func stringPtr(s string) *string {
	return &s
}
