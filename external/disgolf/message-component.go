package disgolf

// MessageComponent represents a message component
type MessageComponent struct {
	CustomID    string
	Handler     Handler
	Middlewares []Handler
}

// MessageComponent try customID on all stored message components
// Method based on https://github.com/bmizerany/pat/blob/0e6a57d3996914bbea76de5a2ce30fc1dbe82e9e/mux.go#L254
// LICENSE allows anything to be done with the code, but I'd like to credit the original
func (cmpnt MessageComponent) try(customID string) (map[string]string, bool) {
	p := make(map[string]string, 0)
	var i, j int
	for i < len(customID) {
		switch {
		case j >= len(cmpnt.CustomID):
			if cmpnt.CustomID != "/" && len(cmpnt.CustomID) > 0 && cmpnt.CustomID[len(cmpnt.CustomID)-1] == '/' {
				return nil, true
			}
			return nil, false
		case cmpnt.CustomID[j] == ':':
			var name, val string
			var nextc byte
			name, nextc, j = match(cmpnt.CustomID, isAlnum, j+1)
			val, _, i = match(customID, matchPart(nextc), i)
			p[name] = val
		case customID[i] == cmpnt.CustomID[j]:
			i++
			j++
		default:
			return nil, false
		}
	}
	if j != len(cmpnt.CustomID) {
		return nil, false
	}
	return p, true
}
