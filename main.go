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
	Id    string `json:"id"`
	Title string `json:"title"`
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
			items = append(items, itemResp{Id: item.Title(), Title: item.Title()})
		}

		writeOK(w, itemsResp{items})
	})

	http.Handle("/", http.FileServer(http.Dir("./web")))

	// One can use generate_cert.go in crypto/tls to generate cert.pem and key.pem.
	log.Printf("About to listen on 8443. Go to https://localhost:8443/")
	err = http.ListenAndServeTLS(":8443", "./conf/cert.pem", "./conf/key.pem", nil)
	log.Fatal(err)
}
