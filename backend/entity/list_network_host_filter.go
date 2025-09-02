package entity

type ListNetworkHostFilter struct {
	ID        []uint64 `json:"id,omitempty"`
	NetworkID []uint64 `json:"network_id,omitempty"`
	Address   []string `json:"address,omitempty"`
	Search    string   `json:"search,omitempty"`
}
