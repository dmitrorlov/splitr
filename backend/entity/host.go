package entity

import (
	"errors"
)

type Host struct {
	ID          uint64    `db:"id"          json:"ID"`
	Address     string    `db:"address"     json:"Address"`
	Description *string   `db:"description" json:"Description"`
	CreatedAt   Timestamp `db:"created_at"  json:"CreatedAt"`
}

func NewHost(address, description string) (*Host, error) {
	if !ipOrHostnameRegex.MatchString(address) {
		return nil, errors.New("invalid address")
	}

	host := &Host{
		Address:   address,
		CreatedAt: NewTimestamp(),
	}

	if description != "" {
		host.Description = &description
	}

	return host, nil
}
