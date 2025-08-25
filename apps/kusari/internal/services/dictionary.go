package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"slices"
	"strings"

	"golang.org/x/text/cases"
	"golang.org/x/text/language"
	"jurien.dev/yugen/shared/utils"
)

type DictionaryService struct{}

func CreateDictionaryService() *DictionaryService {
	utils.Logger.Info("Creating Dictionary Service")
	return &DictionaryService{}
}

func (service *DictionaryService) Check(word string) (found bool, err error) {
	word = strings.ToLower(word)

	replacer := strings.NewReplacer(
		"‘", "'",
		"’", "'",
		"“", `"`,
		"”", `"`,
	)
	word = replacer.Replace(word)
	wiktionaryURL := fmt.Sprintf(
		"https://en.wiktionary.org/w/api.php?action=opensearch&format=json&formatversion=2&search=%s&namespace=0&limit=2",
		url.QueryEscape(word),
	)

	utils.Logger.Debug(wiktionaryURL)
	resp, err := http.Get(wiktionaryURL)
	if err != nil {
		utils.Logger.Fatal(err)
		return
	}
	defer resp.Body.Close()

	utils.Logger.Debug(resp.Status)
	utils.Logger.Debug(resp.Body)
	var respBody []any
	err = json.NewDecoder(resp.Body).Decode(&respBody)
	if err != nil {
		utils.Logger.Fatal(err)
		return
	}

	if len(respBody) == 0 {
		return
	}

	dataWords, err := json.Marshal(respBody[1])
	if err != nil {
		utils.Logger.With("Error", err).Fatal("Marshaling words")
		return
	}
	var words []string
	err = json.Unmarshal(dataWords, &words)
	if err != nil {
		utils.Logger.With("Error", err).Fatal("Unmarshaling words")
		return
	}

	found = slices.Contains(words, word)

	if !found {
		caser := cases.Title(language.English)
		found = slices.Contains(words, caser.String(word))
	}

	return
}
