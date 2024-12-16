package utils

import "regexp"

func SplitWord(word string) (set []string) {
	re := regexp.MustCompile("\b")

	split := re.Split(word, -1)
	set = []string{}

	for i := range split {
		if split[i] == " " {
			continue
		}

		set = append(set, split[i])
	}

	return
}
