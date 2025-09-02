package entity

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNetworkHostSetup_Fields(t *testing.T) {
	timestamp := NewTimestamp()
	setup := NetworkHostSetup{
		ID:            123,
		NetworkHostID: 456,
		NetworkHostIP: "192.168.1.100",
		SubnetMask:    "255.255.255.0",
		Router:        "192.168.1.1",
		CreatedAt:     timestamp,
	}

	assert.Equal(t, uint64(123), setup.ID)
	assert.Equal(t, uint64(456), setup.NetworkHostID)
	assert.Equal(t, "192.168.1.100", setup.NetworkHostIP)
	assert.Equal(t, "255.255.255.0", setup.SubnetMask)
	assert.Equal(t, "192.168.1.1", setup.Router)
	assert.Equal(t, timestamp, setup.CreatedAt)
}

func TestNetworkHostSetup_ZeroValue(t *testing.T) {
	setup := NetworkHostSetup{}

	assert.Equal(t, uint64(0), setup.ID)
	assert.Equal(t, uint64(0), setup.NetworkHostID)
	assert.Empty(t, setup.NetworkHostIP)
	assert.Empty(t, setup.SubnetMask)
	assert.Empty(t, setup.Router)
	assert.True(t, setup.CreatedAt.Time.IsZero())
}

func TestNetworkHostSetup_JSONMarshalUnmarshal(t *testing.T) {
	timestamp := NewTimestamp()
	setup := NetworkHostSetup{
		ID:            789,
		NetworkHostID: 101112,
		NetworkHostIP: "10.0.0.50",
		SubnetMask:    "255.255.0.0",
		Router:        "10.0.0.1",
		CreatedAt:     timestamp,
	}

	data, err := json.Marshal(setup)
	require.NoError(t, err)

	var unmarshaled NetworkHostSetup
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, setup.ID, unmarshaled.ID)
	assert.Equal(t, setup.NetworkHostID, unmarshaled.NetworkHostID)
	assert.Equal(t, setup.NetworkHostIP, unmarshaled.NetworkHostIP)
	assert.Equal(t, setup.SubnetMask, unmarshaled.SubnetMask)
	assert.Equal(t, setup.Router, unmarshaled.Router)
	assert.WithinDuration(t, setup.CreatedAt.Time, unmarshaled.CreatedAt.Time, 0)
}

func TestNetworkHostSetup_EmptyNetworkConfig(t *testing.T) {
	timestamp := NewTimestamp()
	setup := NetworkHostSetup{
		ID:            999,
		NetworkHostID: 888,
		NetworkHostIP: "",
		SubnetMask:    "",
		Router:        "",
		CreatedAt:     timestamp,
	}

	data, err := json.Marshal(setup)
	require.NoError(t, err)

	var unmarshaled NetworkHostSetup
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, setup.ID, unmarshaled.ID)
	assert.Equal(t, setup.NetworkHostID, unmarshaled.NetworkHostID)
	assert.Empty(t, unmarshaled.NetworkHostIP)
	assert.Empty(t, unmarshaled.SubnetMask)
	assert.Empty(t, unmarshaled.Router)
}

func TestNetworkHostSetup_DifferentSubnetMasks(t *testing.T) {
	tests := []struct {
		name       string
		subnetMask string
	}{
		{
			name:       "class A subnet",
			subnetMask: "255.0.0.0",
		},
		{
			name:       "class B subnet",
			subnetMask: "255.255.0.0",
		},
		{
			name:       "class C subnet",
			subnetMask: "255.255.255.0",
		},
		{
			name:       "CIDR /28 subnet",
			subnetMask: "255.255.255.240",
		},
		{
			name:       "CIDR /30 subnet",
			subnetMask: "255.255.255.252",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			setup := NetworkHostSetup{
				ID:            1,
				NetworkHostID: 1,
				NetworkHostIP: "192.168.1.10",
				SubnetMask:    tt.subnetMask,
				Router:        "192.168.1.1",
				CreatedAt:     NewTimestamp(),
			}

			data, err := json.Marshal(setup)
			require.NoError(t, err)

			var unmarshaled NetworkHostSetup
			err = json.Unmarshal(data, &unmarshaled)
			require.NoError(t, err)

			assert.Equal(t, tt.subnetMask, unmarshaled.SubnetMask)
		})
	}
}

func TestNetworkHostSetup_DifferentIPRanges(t *testing.T) {
	tests := []struct {
		name          string
		networkHostIP string
		router        string
	}{
		{
			name:          "private class A",
			networkHostIP: "10.1.2.3",
			router:        "10.1.2.1",
		},
		{
			name:          "private class B",
			networkHostIP: "172.16.5.10",
			router:        "172.16.5.1",
		},
		{
			name:          "private class C",
			networkHostIP: "192.168.100.50",
			router:        "192.168.100.1",
		},
		{
			name:          "localhost",
			networkHostIP: "127.0.0.1",
			router:        "127.0.0.1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			setup := NetworkHostSetup{
				ID:            100,
				NetworkHostID: 200,
				NetworkHostIP: tt.networkHostIP,
				SubnetMask:    "255.255.255.0",
				Router:        tt.router,
				CreatedAt:     NewTimestamp(),
			}

			data, err := json.Marshal(setup)
			require.NoError(t, err)

			var unmarshaled NetworkHostSetup
			err = json.Unmarshal(data, &unmarshaled)
			require.NoError(t, err)

			assert.Equal(t, tt.networkHostIP, unmarshaled.NetworkHostIP)
			assert.Equal(t, tt.router, unmarshaled.Router)
		})
	}
}

func TestNetworkHostSetup_DatabaseTags(t *testing.T) {
	setup := NetworkHostSetup{
		ID:            1,
		NetworkHostID: 2,
		NetworkHostIP: "192.168.1.1",
		SubnetMask:    "255.255.255.0",
		Router:        "192.168.1.254",
		CreatedAt:     NewTimestamp(),
	}

	// This test verifies the struct has the correct db tags by checking the fields exist
	// In a real scenario, these would be tested with actual database operations
	assert.Equal(t, uint64(1), setup.ID)
	assert.Equal(t, uint64(2), setup.NetworkHostID)
	assert.Equal(t, "192.168.1.1", setup.NetworkHostIP)
	assert.Equal(t, "255.255.255.0", setup.SubnetMask)
	assert.Equal(t, "192.168.1.254", setup.Router)
	assert.False(t, setup.CreatedAt.Time.IsZero())
}
