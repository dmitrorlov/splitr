package entity

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewNetworkHost_ValidInputs(t *testing.T) {
	tests := []struct {
		name        string
		networkID   uint64
		address     string
		description string
	}{
		{
			name:        "valid IPv4 with description",
			networkID:   100,
			address:     "192.168.1.10",
			description: "Web server",
		},
		{
			name:        "valid IPv4 without description",
			networkID:   200,
			address:     "10.0.0.5",
			description: "",
		},
		{
			name:        "valid hostname with description",
			networkID:   300,
			address:     "server.example.com",
			description: "Application server",
		},
		{
			name:        "valid hostname without description",
			networkID:   400,
			address:     "database.local",
			description: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			networkHost, err := NewNetworkHost(tt.networkID, tt.address, tt.description)

			require.NoError(t, err)
			require.NotNil(t, networkHost)

			assert.Equal(t, tt.networkID, networkHost.NetworkID)
			assert.Equal(t, tt.address, networkHost.Address)
			assert.Equal(t, uint64(0), networkHost.ID)           // Should be zero for new host
			assert.False(t, networkHost.CreatedAt.Time.IsZero()) // Should have timestamp

			if tt.description == "" {
				assert.Nil(t, networkHost.Description)
			} else {
				require.NotNil(t, networkHost.Description)
				assert.Equal(t, tt.description, *networkHost.Description)
			}
		})
	}
}

func TestNewNetworkHost_InvalidAddresses(t *testing.T) {
	tests := []struct {
		name    string
		address string
	}{
		{
			name:    "empty address",
			address: "",
		},
		{
			name:    "invalid IPv4",
			address: "999.999.999.999",
		},
		{
			name:    "malformed hostname",
			address: "-invalid.com",
		},
		{
			name:    "space in address",
			address: "192.168.1.1 ",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			networkHost, err := NewNetworkHost(100, tt.address, "test description")

			require.Error(t, err)
			assert.Nil(t, networkHost)
			assert.Equal(t, "invalid address", err.Error())
		})
	}
}

func TestNewNetworkHost_ZeroNetworkID(t *testing.T) {
	networkHost, err := NewNetworkHost(0, "192.168.1.1", "Test")

	require.NoError(t, err)
	require.NotNil(t, networkHost)
	assert.Equal(t, uint64(0), networkHost.NetworkID)
}

func TestNetworkHost_Fields(t *testing.T) {
	timestamp := NewTimestamp()
	description := "Database server"

	networkHost := NetworkHost{
		ID:          123,
		NetworkID:   456,
		Address:     "192.168.1.100",
		Description: &description,
		CreatedAt:   timestamp,
	}

	assert.Equal(t, uint64(123), networkHost.ID)
	assert.Equal(t, uint64(456), networkHost.NetworkID)
	assert.Equal(t, "192.168.1.100", networkHost.Address)
	require.NotNil(t, networkHost.Description)
	assert.Equal(t, "Database server", *networkHost.Description)
	assert.Equal(t, timestamp, networkHost.CreatedAt)
}

func TestNetworkHostExportPayload_Fields(t *testing.T) {
	exportDate := time.Date(2023, 12, 1, 10, 0, 0, 0, time.UTC)
	hosts := []NetworkHostDTO{
		{
			Address:     "192.168.1.1",
			Description: "Router",
		},
		{
			Address:     "192.168.1.2",
			Description: "Switch",
		},
	}

	payload := NetworkHostExportPayload{
		ExportDate: exportDate,
		NetworkID:  100,
		Hosts:      hosts,
	}

	assert.Equal(t, exportDate, payload.ExportDate)
	assert.Equal(t, uint64(100), payload.NetworkID)
	assert.Len(t, payload.Hosts, 2)
	assert.Equal(t, hosts, payload.Hosts)
}

func TestNetworkHostExportPayload_JSONMarshalUnmarshal(t *testing.T) {
	payload := NetworkHostExportPayload{
		ExportDate: time.Date(2023, 12, 1, 15, 30, 0, 0, time.UTC),
		NetworkID:  200,
		Hosts: []NetworkHostDTO{
			{
				Address:     "example.com",
				Description: "Web server",
			},
		},
	}

	data, err := json.Marshal(payload)
	require.NoError(t, err)

	var unmarshaled NetworkHostExportPayload
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.True(t, payload.ExportDate.Equal(unmarshaled.ExportDate))
	assert.Equal(t, payload.NetworkID, unmarshaled.NetworkID)
	assert.Equal(t, payload.Hosts, unmarshaled.Hosts)
}

func TestNetworkHostContextExportPayload_Fields(t *testing.T) {
	exportDate := time.Date(2023, 11, 15, 9, 0, 0, 0, time.UTC)
	hosts := []NetworkHostDTO{
		{
			Address:     "10.0.0.1",
			Description: "Gateway",
		},
	}

	payload := NetworkHostContextExportPayload{
		ExportDate: exportDate,
		Hosts:      hosts,
	}

	assert.Equal(t, exportDate, payload.ExportDate)
	assert.Len(t, payload.Hosts, 1)
	assert.Equal(t, hosts, payload.Hosts)
}

func TestNetworkHostContextExportPayload_JSONMarshalUnmarshal(t *testing.T) {
	payload := NetworkHostContextExportPayload{
		ExportDate: time.Date(2023, 10, 20, 14, 45, 0, 0, time.UTC),
		Hosts: []NetworkHostDTO{
			{
				Address:     "api.service.local",
				Description: "API Gateway",
			},
			{
				Address:     "db.service.local",
				Description: "",
			},
		},
	}

	data, err := json.Marshal(payload)
	require.NoError(t, err)

	var unmarshaled NetworkHostContextExportPayload
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.True(t, payload.ExportDate.Equal(unmarshaled.ExportDate))
	assert.Equal(t, payload.Hosts, unmarshaled.Hosts)
}

func TestNetworkHostDTO_Fields(t *testing.T) {
	dto := NetworkHostDTO{
		Address:     "192.168.1.50",
		Description: "File server",
	}

	assert.Equal(t, "192.168.1.50", dto.Address)
	assert.Equal(t, "File server", dto.Description)
}

func TestNetworkHostDTO_EmptyDescription(t *testing.T) {
	dto := NetworkHostDTO{
		Address:     "server.local",
		Description: "",
	}

	assert.Equal(t, "server.local", dto.Address)
	assert.Empty(t, dto.Description)
}

func TestNetworkHostDTO_JSONMarshalUnmarshal(t *testing.T) {
	dto := NetworkHostDTO{
		Address:     "test.example.com",
		Description: "Test server with long description",
	}

	data, err := json.Marshal(dto)
	require.NoError(t, err)

	var unmarshaled NetworkHostDTO
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, dto, unmarshaled)
}

func TestNetworkHostDTO_OmitEmptyDescription(t *testing.T) {
	dto := NetworkHostDTO{
		Address:     "minimal.example.com",
		Description: "",
	}

	data, err := json.Marshal(dto)
	require.NoError(t, err)

	// Verify that empty description is omitted from JSON
	assert.Contains(t, string(data), `"address":"minimal.example.com"`)
	assert.NotContains(t, string(data), `"description"`)
}

func TestNetworkHostExportPayload_EmptyHosts(t *testing.T) {
	payload := NetworkHostExportPayload{
		NetworkID: 999,
		Hosts:     []NetworkHostDTO{},
	}

	assert.Empty(t, payload.Hosts)
	assert.Equal(t, uint64(999), payload.NetworkID)
}

func TestNetworkHostContextExportPayload_EmptyHosts(t *testing.T) {
	payload := NetworkHostContextExportPayload{
		Hosts: []NetworkHostDTO{},
	}

	assert.Empty(t, payload.Hosts)
}
