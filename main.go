package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"regexp"
	"strings"
)

func main() {
	fileList, err := DirWalk("./koel")
	if err != nil {
		panic(err)
	}

	depsSlice := make([]Deps, 0)
	for i, file := range fileList {
		deps, err := ParseFile(file)
		depsSlice = append(depsSlice, deps...)
		if err != nil {
			panic(err)
		}

		if i > 60 {
			break
		}
	}

	LogAsJson("deps: ", depsSlice)
}

type Deps struct {
	From *FromDependencies `json:"from"`
	To   *ToDependencies   `json:"to"`
}

type FromDependencies struct {
	Path string `json:"path"`
}

type ToDependencies struct {
	Path string `json:"path"`
}

func LogAsJson(message string, v interface{}) {
	b, err := json.Marshal(v)
	if err != nil {
		log.Printf("failed to marshal json %v with error %v", v, err)
	}
	log.Println(message, string(b))
}

func ParseFile(filePath string) ([]Deps, error) {
	reg := regexp.MustCompile(`.*\.php`)
	match := reg.MatchString(filePath)
	if !match {
		return nil, nil
	}

	f, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	b, err := ioutil.ReadAll(f)
	if err != nil {
		return nil, err
	}
	deps, err := FindDependency(b)
	if err != nil {
		panic(err)
	}

	depsSlice := make([]Deps, 0)
	for _, v := range deps {
		depsSlice = append(depsSlice, Deps{
			From: &FromDependencies{
				Path: FormatFromFilePath(filePath),
			},
			To: &ToDependencies{
				Path: FormatToPath(v),
			},
		})
	}
	return depsSlice, nil
}

func FormatFromFilePath(fromFilePath string) string {
	return strings.Replace(fromFilePath, "koel/", "", -1)
}

func FormatToPath(toPath string) string {
	return strings.Replace(toPath, "\\", "/", -1)
}

func FindDependency(content []byte) ([]string, error) {
	reg := regexp.MustCompile(`use\s(.+);`)
	match := reg.FindAllSubmatch(content, -1)

	strSlice := make([]string, 0)
	for _, i_v := range match {
		strSlice = append(strSlice, string(i_v[1]))
	}
	return strSlice, nil
}
