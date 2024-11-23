package disgolf

import "errors"

var (
	// ErrCommandNotExists means that the requested command does not exist.
	ErrCommandNotExists = errors.New("command not exists")

	// 	ErrMessageComponentNotExists means that the requested message component does not exist.
	ErrMessageComponentNotExists = errors.New("message component not exists")
)
