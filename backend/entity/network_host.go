package entity

import (
	"errors"
	"time"
)

type NetworkHost struct {
	ID          uint64    `db:"id"          json:"ID"`
	NetworkID   uint64    `db:"network_id"  json:"NetworkID"`
	Address     string    `db:"address"     json:"Address"`
	Description *string   `db:"description" json:"Description"`
	CreatedAt   Timestamp `db:"created_at"  json:"CreatedAt"`
}

func NewNetworkHost(networkID uint64, address, description string) (*NetworkHost, error) {
	if !ipOrHostnameRegex.MatchString(address) {
		return nil, errors.New("invalid address")
	}

	networkHost := &NetworkHost{
		NetworkID: networkID,
		Address:   address,
		CreatedAt: NewTimestamp(),
	}

	if description != "" {
		networkHost.Description = &description
	}

	return networkHost, nil
}

// NetworkHostExportPayload represents the structure for exporting/importing network hosts
// Used for system-wide exports that may include network ID context.
type NetworkHostExportPayload struct {
	ExportDate time.Time        `json:"export_date"`
	NetworkID  uint64           `json:"network_id"`
	Hosts      []NetworkHostDTO `json:"hosts"`
}

// NetworkHostContextExportPayload represents the structure for exporting network hosts
// from a specific network context where network ID is already known.
type NetworkHostContextExportPayload struct {
	ExportDate time.Time        `json:"export_date"`
	Hosts      []NetworkHostDTO `json:"hosts"`
}

// NetworkHostDTO represents a network host without internal IDs for export/import.
type NetworkHostDTO struct {
	Address     string `json:"address"`
	Description string `json:"description,omitempty"`
}
