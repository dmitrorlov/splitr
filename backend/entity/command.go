package entity

import (
	"strings"
)

type Command struct {
	Executable string
	Args       []string
}

func (c *Command) String() string {
	return c.Executable + " " + strings.Join(c.Args, " ")
}
