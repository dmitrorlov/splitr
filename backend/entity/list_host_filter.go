package entity

type ListHostFilter struct {
	ID     []uint64 `json:"id,omitempty"`
	Search string   `json:"search,omitempty"`
}
