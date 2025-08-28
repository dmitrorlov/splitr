package entity

import (
	"regexp"
)

const (
	ipOrHostnameRegexString = `^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}` +
		`(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)+` +
		`([A-Za-z]{2,7}|[A-Za-z][A-Za-z0-9\-]{2,7})$`
)

var ipOrHostnameRegex = regexp.MustCompile(ipOrHostnameRegexString)
