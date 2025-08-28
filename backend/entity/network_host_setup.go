package entity

type NetworkHostSetup struct {
	ID            uint64    `db:"id"              json:"ID"`
	NetworkHostID uint64    `db:"network_host_id" json:"NetworkHostID"`
	NetworkHostIP string    `db:"network_host_ip" json:"NetworkHostIP"`
	SubnetMask    string    `db:"subnet_mask"     json:"SubnetMask"`
	Router        string    `db:"router"          json:"Router"`
	CreatedAt     Timestamp `db:"created_at"      json:"CreatedAt"`
}
