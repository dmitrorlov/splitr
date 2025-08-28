package command

import (
	"regexp"
)

const (
	regexpPartIP = `(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})`

	regexpVpnName            = `"([^"]+)"`
	regexpInterfaceName      = `Device: (\w+)`
	regexpNetworkServiceName = `\(\d+\) (.+)`
	regexpSubnetMask         = `Subnet mask: ` + regexpPartIP
	regexpRouter             = `Router: ` + regexpPartIP

	minVPNNameParseLength            = 2
	minInterfaceNameParseLength      = 2
	minNetworkServiceNameParseLength = 2
	minSubnetMaskParseLength         = 2
	minRouterParseLength             = 2
)

type outputParser struct{}

func newOutputParser() *outputParser {
	return &outputParser{}
}

func (p *outputParser) parseVPNName(line string) string {
	r := regexp.MustCompile(regexpVpnName)
	m := r.FindStringSubmatch(line)

	if len(m) < minVPNNameParseLength {
		return ""
	}

	return m[1]
}

func (p *outputParser) parseInterfaceName(line string) string {
	r := regexp.MustCompile(regexpInterfaceName)
	m := r.FindStringSubmatch(line)

	if len(m) < minInterfaceNameParseLength {
		return ""
	}

	return m[1]
}

func (p *outputParser) parseNetworkServiceName(line string) string {
	r := regexp.MustCompile(regexpNetworkServiceName)
	m := r.FindStringSubmatch(line)

	if len(m) < minNetworkServiceNameParseLength {
		return ""
	}

	return m[1]
}

func (p *outputParser) parseSubnetMask(line string) string {
	r := regexp.MustCompile(regexpSubnetMask)
	m := r.FindStringSubmatch(line)

	if len(m) < minSubnetMaskParseLength {
		return ""
	}

	return m[1]
}

func (p *outputParser) parseRouter(line string) string {
	r := regexp.MustCompile(regexpRouter)
	m := r.FindStringSubmatch(line)

	if len(m) < minRouterParseLength {
		return ""
	}

	return m[1]
}
