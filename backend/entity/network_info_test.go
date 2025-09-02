package entity

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNetworkInfo_String(t *testing.T) {
	tests := []struct {
		name     string
		info     NetworkInfo
		expected string
	}{
		{
			name: "both fields populated",
			info: NetworkInfo{
				SubnetMask: "255.255.255.0",
				Router:     "192.168.1.1",
			},
			expected: "Subnet Mask: 255.255.255.0, Router: 192.168.1.1",
		},
		{
			name: "empty subnet mask",
			info: NetworkInfo{
				SubnetMask: "",
				Router:     "10.0.0.1",
			},
			expected: "Subnet Mask: , Router: 10.0.0.1",
		},
		{
			name: "empty router",
			info: NetworkInfo{
				SubnetMask: "255.255.0.0",
				Router:     "",
			},
			expected: "Subnet Mask: 255.255.0.0, Router: ",
		},
		{
			name: "both fields empty",
			info: NetworkInfo{
				SubnetMask: "",
				Router:     "",
			},
			expected: "Subnet Mask: , Router: ",
		},
		{
			name:     "zero value struct",
			info:     NetworkInfo{},
			expected: "Subnet Mask: , Router: ",
		},
		{
			name: "class A network",
			info: NetworkInfo{
				SubnetMask: "255.0.0.0",
				Router:     "10.1.1.1",
			},
			expected: "Subnet Mask: 255.0.0.0, Router: 10.1.1.1",
		},
		{
			name: "class B network",
			info: NetworkInfo{
				SubnetMask: "255.255.0.0",
				Router:     "172.16.1.1",
			},
			expected: "Subnet Mask: 255.255.0.0, Router: 172.16.1.1",
		},
		{
			name: "CIDR /28 network",
			info: NetworkInfo{
				SubnetMask: "255.255.255.240",
				Router:     "192.168.1.254",
			},
			expected: "Subnet Mask: 255.255.255.240, Router: 192.168.1.254",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.info.String()
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestNetworkInfo_Fields(t *testing.T) {
	info := NetworkInfo{
		SubnetMask: "255.255.255.192",
		Router:     "192.168.1.65",
	}

	assert.Equal(t, "255.255.255.192", info.SubnetMask)
	assert.Equal(t, "192.168.1.65", info.Router)
}

func TestNetworkInfo_ZeroValue(t *testing.T) {
	info := NetworkInfo{}

	assert.Empty(t, info.SubnetMask)
	assert.Empty(t, info.Router)
}

func TestNetworkInterface_Type(t *testing.T) {
	var iface NetworkInterface = "eth0"
	assert.Equal(t, NetworkInterface("eth0"), iface)
	assert.Equal(t, "eth0", string(iface))
}

func TestNetworkService_Type(t *testing.T) {
	var service NetworkService = "Wi-Fi"
	assert.Equal(t, NetworkService("Wi-Fi"), service)
	assert.Equal(t, "Wi-Fi", string(service))
}

func TestVPNService_Type(t *testing.T) {
	var vpn VPNService = "OpenVPN"
	assert.Equal(t, VPNService("OpenVPN"), vpn)
	assert.Equal(t, "OpenVPN", string(vpn))
}

func TestNetworkInterface_EmptyValue(t *testing.T) {
	var iface NetworkInterface
	assert.Equal(t, NetworkInterface(""), iface)
	assert.Empty(t, string(iface))
}

func TestNetworkService_EmptyValue(t *testing.T) {
	var service NetworkService
	assert.Equal(t, NetworkService(""), service)
	assert.Empty(t, string(service))
}

func TestVPNService_EmptyValue(t *testing.T) {
	var vpn VPNService
	assert.Equal(t, VPNService(""), vpn)
	assert.Empty(t, string(vpn))
}

func TestNetworkInterface_CommonValues(t *testing.T) {
	tests := []struct {
		name  string
		iface NetworkInterface
	}{
		{"ethernet", NetworkInterface("eth0")},
		{"wireless", NetworkInterface("wlan0")},
		{"loopback", NetworkInterface("lo")},
		{"bluetooth", NetworkInterface("bluetooth0")},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.NotEmpty(t, string(tt.iface))
		})
	}
}

func TestNetworkService_CommonValues(t *testing.T) {
	tests := []struct {
		name    string
		service NetworkService
	}{
		{"wifi", NetworkService("Wi-Fi")},
		{"ethernet", NetworkService("Ethernet")},
		{"bluetooth", NetworkService("Bluetooth PAN")},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.NotEmpty(t, string(tt.service))
		})
	}
}

func TestVPNService_CommonValues(t *testing.T) {
	tests := []struct {
		name string
		vpn  VPNService
	}{
		{"openvpn", VPNService("OpenVPN")},
		{"wireguard", VPNService("WireGuard")},
		{"ipsec", VPNService("IPSec")},
		{"pptp", VPNService("PPTP")},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.NotEmpty(t, string(tt.vpn))
		})
	}
}
