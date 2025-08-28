package entity

type Network struct {
	ID        uint64    `db:"id"         json:"ID"`
	Name      string    `db:"name"       json:"Name"`
	CreatedAt Timestamp `db:"created_at" json:"CreatedAt"`
}

type NetworkWithStatus struct {
	Network

	IsActive bool `json:"IsActive"`
}
