package errs

import (
	"errors"
)

var (
	ErrHostNotFound      = errors.New("host not found")
	ErrHostAlreadyExists = errors.New("host already exists")

	ErrNetworkNotFound      = errors.New("network not found")
	ErrNetworkAlreadyExists = errors.New("network already exists")

	ErrNetworkHostNotFound      = errors.New("network host not found")
	ErrNetworkHostAlreadyExists = errors.New("network host already exists")

	ErrVPNServiceNotFound = errors.New("vpn service not found")
)
