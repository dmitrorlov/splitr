package entity

type ListNetworkFilter struct {
	ID     []uint64 `json:"id,omitempty"`
	Name   []string `json:"name,omitempty"`
	Search string   `json:"search,omitempty"`
}
