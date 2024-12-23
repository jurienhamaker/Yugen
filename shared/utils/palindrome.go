package utils

import (
	"strings"
)

func IsPalindrome(originalString string) bool {
	reverseString := ""
	length := len(originalString)

	for i := length - 1; i >= 0; i-- {
		reverseString = reverseString + string(originalString[i])
	}

	return strings.EqualFold(originalString, reverseString)
}
