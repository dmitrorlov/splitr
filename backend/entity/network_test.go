package entity

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNetwork_Fields(t *testing.T) {
	timestamp := NewTimestamp()
	network := Network{
		ID:        123,
		Name:      "Production Network",
		CreatedAt: timestamp,
	}

	assert.Equal(t, uint64(123), network.ID)
	assert.Equal(t, "Production Network", network.Name)
	assert.Equal(t, timestamp, network.CreatedAt)
}

func TestNetwork_ZeroValue(t *testing.T) {
	network := Network{}

	assert.Equal(t, uint64(0), network.ID)
	assert.Empty(t, network.Name)
	assert.True(t, network.CreatedAt.Time.IsZero())
}

func TestNetwork_JSONMarshalUnmarshal(t *testing.T) {
	timestamp := NewTimestamp()
	network := Network{
		ID:        456,
		Name:      "Development Network",
		CreatedAt: timestamp,
	}

	data, err := json.Marshal(network)
	require.NoError(t, err)

	var unmarshaled Network
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, network.ID, unmarshaled.ID)
	assert.Equal(t, network.Name, unmarshaled.Name)
	// Compare timestamps as they may have slight differences due to JSON precision
	assert.WithinDuration(t, network.CreatedAt.Time, unmarshaled.CreatedAt.Time, 0)
}

func TestNetwork_EmptyName(t *testing.T) {
	network := Network{
		ID:        789,
		Name:      "",
		CreatedAt: NewTimestamp(),
	}

	data, err := json.Marshal(network)
	require.NoError(t, err)

	var unmarshaled Network
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, network.ID, unmarshaled.ID)
	assert.Empty(t, unmarshaled.Name)
}

func TestNetworkWithStatus_Fields(t *testing.T) {
	timestamp := NewTimestamp()
	networkWithStatus := NetworkWithStatus{
		Network: Network{
			ID:        100,
			Name:      "Staging Network",
			CreatedAt: timestamp,
		},
		IsActive: true,
	}

	assert.Equal(t, uint64(100), networkWithStatus.ID)
	assert.Equal(t, "Staging Network", networkWithStatus.Name)
	assert.Equal(t, timestamp, networkWithStatus.CreatedAt)
	assert.True(t, networkWithStatus.IsActive)
}

func TestNetworkWithStatus_InactiveNetwork(t *testing.T) {
	timestamp := NewTimestamp()
	networkWithStatus := NetworkWithStatus{
		Network: Network{
			ID:        200,
			Name:      "Inactive Network",
			CreatedAt: timestamp,
		},
		IsActive: false,
	}

	assert.Equal(t, uint64(200), networkWithStatus.ID)
	assert.Equal(t, "Inactive Network", networkWithStatus.Name)
	assert.Equal(t, timestamp, networkWithStatus.CreatedAt)
	assert.False(t, networkWithStatus.IsActive)
}

func TestNetworkWithStatus_JSONMarshalUnmarshal(t *testing.T) {
	timestamp := NewTimestamp()
	networkWithStatus := NetworkWithStatus{
		Network: Network{
			ID:        300,
			Name:      "Test Network",
			CreatedAt: timestamp,
		},
		IsActive: true,
	}

	data, err := json.Marshal(networkWithStatus)
	require.NoError(t, err)

	var unmarshaled NetworkWithStatus
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, networkWithStatus.ID, unmarshaled.ID)
	assert.Equal(t, networkWithStatus.Name, unmarshaled.Name)
	assert.WithinDuration(t, networkWithStatus.CreatedAt.Time, unmarshaled.CreatedAt.Time, 0)
	assert.Equal(t, networkWithStatus.IsActive, unmarshaled.IsActive)
}

func TestNetworkWithStatus_ZeroValue(t *testing.T) {
	networkWithStatus := NetworkWithStatus{}

	assert.Equal(t, uint64(0), networkWithStatus.ID)
	assert.Empty(t, networkWithStatus.Name)
	assert.True(t, networkWithStatus.CreatedAt.Time.IsZero())
	assert.False(t, networkWithStatus.IsActive)
}

func TestNetworkWithStatus_EmbeddedNetworkAccess(t *testing.T) {
	timestamp := NewTimestamp()
	networkWithStatus := NetworkWithStatus{
		Network: Network{
			ID:        400,
			Name:      "Embedded Test",
			CreatedAt: timestamp,
		},
	}

	// Test that we can access Network fields directly due to embedding
	assert.Equal(t, uint64(400), networkWithStatus.Network.ID)
	assert.Equal(t, "Embedded Test", networkWithStatus.Network.Name)
	assert.Equal(t, timestamp, networkWithStatus.Network.CreatedAt)

	// Test that embedded fields are accessible directly
	assert.Equal(t, uint64(400), networkWithStatus.ID)
	assert.Equal(t, "Embedded Test", networkWithStatus.Name)
	assert.Equal(t, timestamp, networkWithStatus.CreatedAt)
}
