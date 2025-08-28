package entity

import (
	"fmt"
)

type (
	NetworkInterface string
	NetworkService   string
	VPNService       string
)

type NetworkInfo struct {
	SubnetMask string
	Router     string
}

func (n *NetworkInfo) String() string {
	return fmt.Sprintf("Subnet Mask: %s, Router: %s", n.SubnetMask, n.Router)
}
