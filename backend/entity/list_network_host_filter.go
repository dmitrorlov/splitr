package entity

type ListNetworkHostFilter struct {
	ID        []uint64
	NetworkID []uint64
	Address   []string
	Search    string
}
