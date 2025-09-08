package entity

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestListHostFilter_Fields(t *testing.T) {
	filter := ListHostFilter{
		ID:     []uint64{1, 2, 3},
		Search: "test search",
	}

	assert.Equal(t, []uint64{1, 2, 3}, filter.ID)
	assert.Equal(t, "test search", filter.Search)
	assert.Len(t, filter.ID, 3)
}

func TestListHostFilter_ZeroValue(t *testing.T) {
	filter := ListHostFilter{}

	assert.Nil(t, filter.ID)
	assert.Empty(t, filter.Search)
}

func TestListHostFilter_JSONMarshalUnmarshal(t *testing.T) {
	filter := ListHostFilter{
		ID:     []uint64{10, 20, 30},
		Search: "host search query",
	}

	data, err := json.Marshal(filter)
	require.NoError(t, err)

	var unmarshaled ListHostFilter
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, filter, unmarshaled)
}

func TestListHostFilter_EmptyID(t *testing.T) {
	filter := ListHostFilter{
		ID:     []uint64{},
		Search: "empty id slice",
	}

	assert.Empty(t, filter.ID)
	assert.Equal(t, "empty id slice", filter.Search)
}

func TestListNetworkFilter_Fields(t *testing.T) {
	filter := ListNetworkFilter{
		ID:     []uint64{100, 200},
		Name:   []string{"network1", "network2"},
		Search: "network search",
	}

	assert.Equal(t, []uint64{100, 200}, filter.ID)
	assert.Equal(t, []string{"network1", "network2"}, filter.Name)
	assert.Equal(t, "network search", filter.Search)
	assert.Len(t, filter.ID, 2)
	assert.Len(t, filter.Name, 2)
}

func TestListNetworkFilter_ZeroValue(t *testing.T) {
	filter := ListNetworkFilter{}

	assert.Nil(t, filter.ID)
	assert.Nil(t, filter.Name)
	assert.Empty(t, filter.Search)
}

func TestListNetworkFilter_JSONMarshalUnmarshal(t *testing.T) {
	filter := ListNetworkFilter{
		ID:     []uint64{5, 15, 25},
		Name:   []string{"prod", "staging", "dev"},
		Search: "environment networks",
	}

	data, err := json.Marshal(filter)
	require.NoError(t, err)

	var unmarshaled ListNetworkFilter
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, filter, unmarshaled)
}

func TestListNetworkFilter_EmptySlices(t *testing.T) {
	filter := ListNetworkFilter{
		ID:     []uint64{},
		Name:   []string{},
		Search: "empty slices",
	}

	assert.Empty(t, filter.ID)
	assert.Empty(t, filter.Name)
	assert.Equal(t, "empty slices", filter.Search)
}

func TestListNetworkHostFilter_Fields(t *testing.T) {
	filter := ListNetworkHostFilter{
		ID:        []uint64{1, 2},
		NetworkID: []uint64{10, 20},
		Address:   []string{"192.168.1.1", "192.168.1.2"},
		Search:    "network host search",
	}

	assert.Equal(t, []uint64{1, 2}, filter.ID)
	assert.Equal(t, []uint64{10, 20}, filter.NetworkID)
	assert.Equal(t, []string{"192.168.1.1", "192.168.1.2"}, filter.Address)
	assert.Equal(t, "network host search", filter.Search)
	assert.Len(t, filter.ID, 2)
	assert.Len(t, filter.NetworkID, 2)
	assert.Len(t, filter.Address, 2)
}

func TestListNetworkHostFilter_ZeroValue(t *testing.T) {
	filter := ListNetworkHostFilter{}

	assert.Nil(t, filter.ID)
	assert.Nil(t, filter.NetworkID)
	assert.Nil(t, filter.Address)
	assert.Empty(t, filter.Search)
}

func TestListNetworkHostFilter_JSONMarshalUnmarshal(t *testing.T) {
	filter := ListNetworkHostFilter{
		ID:        []uint64{111, 222, 333},
		NetworkID: []uint64{1000, 2000},
		Address:   []string{"example.com", "test.local", "192.168.0.1"},
		Search:    "mixed addresses",
	}

	data, err := json.Marshal(filter)
	require.NoError(t, err)

	var unmarshaled ListNetworkHostFilter
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, filter, unmarshaled)
}

func TestListNetworkHostFilter_MismatchedSliceLengths(t *testing.T) {
	filter := ListNetworkHostFilter{
		ID:        []uint64{1},
		NetworkID: []uint64{10, 20, 30},
		Address:   []string{"host1", "host2"},
		Search:    "mismatched lengths",
	}

	assert.Len(t, filter.ID, 1)
	assert.Len(t, filter.NetworkID, 3)
	assert.Len(t, filter.Address, 2)
	assert.Equal(t, "mismatched lengths", filter.Search)
}

func TestListNetworkHostFilter_EmptySlices(t *testing.T) {
	filter := ListNetworkHostFilter{
		ID:        []uint64{},
		NetworkID: []uint64{},
		Address:   []string{},
		Search:    "all empty",
	}

	assert.Empty(t, filter.ID)
	assert.Empty(t, filter.NetworkID)
	assert.Empty(t, filter.Address)
	assert.Equal(t, "all empty", filter.Search)
}
