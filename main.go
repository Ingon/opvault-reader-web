package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/Ingon/opvault"
)

func check(err error) {
	if err != nil {
		panic(err)
	}
}

type stateResp struct {
	Path   string `json:"path"`
	Locked bool   `json:"locked"`
}

type unlockReq struct {
	Password string `json:"password"`
}

type unlockResp struct {
	Path   string `json:"path"`
	Locked bool   `json:"locked"`
	Error  string `json:"error"`
}

type itemsResp struct {
	Items []itemResp `json:"items"`
}

type itemResp struct {
	Id       string        `json:"id"`
	Title    string        `json:"title"`
	Fields   []itemField   `json:"fields"`
	Notes    string        `json:"notes"`
	Sections []itemSection `json:"sections"`
}

type itemField struct {
	Type        string `json:"type"`
	Name        string `json:"name"`
	Value       string `json:"value"`
	Designation string `json:"designation"`
}

type itemSection struct {
	Name   string             `json:"name"`
	Title  string             `json:"title"`
	Fields []itemSectionField `json:"fields"`
}

type itemSectionField struct {
	Kind  string `json:"kind"`
	Name  string `json:"name"`
	Title string `json:"title"`
	Value string `json:"value"`
}

func writeResult(w http.ResponseWriter, statusCode int, obj interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(obj)
}

func writeOK(w http.ResponseWriter, obj interface{}) {
	writeResult(w, http.StatusOK, obj)
}

func main() {
	location := os.Args[1]
	locked := true

	vault, err := opvault.Open(location)
	check(err)

	profile, err := vault.Profile("default")
	check(err)

	http.HandleFunc("/api/state", func(w http.ResponseWriter, req *http.Request) {
		writeOK(w, stateResp{Path: location, Locked: locked})
	})
	http.HandleFunc("/api/lock", func(w http.ResponseWriter, req *http.Request) {
		profile.Lock()
		locked = true

		writeOK(w, stateResp{Path: location, Locked: locked})
	})
	http.HandleFunc("/api/unlock", func(w http.ResponseWriter, req *http.Request) {
		unlock := unlockReq{}

		err := json.NewDecoder(req.Body).Decode(&unlock)
		check(err)

		err = profile.Unlock(unlock.Password)
		if err != nil {
			writeResult(w, http.StatusUnauthorized, unlockResp{Locked: locked, Error: err.Error()})
			return
		}

		locked = false
		writeOK(w, unlockResp{Path: location, Locked: locked})
	})
	http.HandleFunc("/api/items", func(w http.ResponseWriter, req *http.Request) {
		opitems, err := profile.Items()
		check(err)

		var items []itemResp
		for _, item := range opitems {
			items = append(items, itemResp{Id: item.UUID(), Title: item.Title()})
		}

		writeOK(w, itemsResp{items})
	})
	http.HandleFunc("/api/item", func(w http.ResponseWriter, req *http.Request) {
		uuid := req.URL.Query().Get("id")

		opitems, err := profile.Items()
		check(err)

		for _, item := range opitems {
			if item.UUID() == uuid {
				detail, err := item.Detail()
				check(err)

				var fields []itemField
				for _, field := range detail.Fields() {
					fields = append(fields, itemField{
						Type:        string(field.Type()),
						Name:        field.Name(),
						Value:       field.Value(),
						Designation: string(field.Designation()),
					})
				}

				var sections []itemSection
				for _, section := range detail.Sections() {
					var sectionFields []itemSectionField
					for _, field := range section.Fields() {
						sectionFields = append(sectionFields, itemSectionField{
							Kind:  string(field.Kind()),
							Name:  field.Name(),
							Title: field.Title(),
							Value: field.Value(),
						})
					}
					sections = append(sections, itemSection{
						Name:   section.Name(),
						Title:  section.Title(),
						Fields: sectionFields,
					})
				}

				writeOK(w, itemResp{
					Id:       item.UUID(),
					Title:    item.Title(),
					Fields:   fields,
					Notes:    detail.Notes(),
					Sections: sections,
				})
				return
			}
		}

		w.WriteHeader(http.StatusNotFound)
	})

	http.Handle("/", http.FileServer(http.Dir("./web")))

	// One can use generate_cert.go in crypto/tls to generate cert.pem and key.pem.
	log.Printf("About to listen on 8443. Go to https://localhost:8443/")
	err = http.ListenAndServeTLS(":8443", "./conf/cert.pem", "./conf/key.pem", nil)
	log.Fatal(err)
}
