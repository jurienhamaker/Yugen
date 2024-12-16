package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"slices"
	"strings"

	"jurien.dev/yugen/shared/utils"
)

type DictionaryService struct{}

func CreateDictionaryService() *DictionaryService {
	utils.Logger.Info("Creating Dictionary Service")
	return &DictionaryService{}
}

func (service *DictionaryService) Check(word string) (found bool, err error) {
	word = strings.ToLower(word)
	wiktionaryUrl := fmt.Sprintf("https://en.wiktionary.org/w/api.php?action=opensearch&format=json&formatversion=2&search=%s&namespace=0&limit=2", url.QueryEscape(word))

	resp, err := http.Get(wiktionaryUrl)
	if err != nil {
		utils.Logger.Fatal(err)
		return
	}
	defer resp.Body.Close()

	var respBody []interface{}
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

	return
}
