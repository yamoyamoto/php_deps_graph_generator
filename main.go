package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"regexp"
)

func main() {
	fileList, err := DirWalk("./framework")
	if err != nil {
		panic(err)
	}

	for i, file := range fileList {
		err := ParseFile(file)
		if err != nil {
			panic(err)
		}

		if i > 60 {
			break
		}
	}

}

func ParseFile(filePath string) error {
	reg := regexp.MustCompile(`.*\.php`)
	match := reg.MatchString(filePath)
	if !match {
		return nil
	}

	f, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer f.Close()

	b, err := ioutil.ReadAll(f)
	if err != nil {
		return err
	}
	deps, err := FindDependency(b)
	if err != nil {
		panic(err)
	}

	for _, v := range deps {
		fmt.Printf("find dependency at %s: %s\n", filePath, v)
	}
	return nil
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

func DirWalk(dir string) ([]string, error) {
	files, err := ioutil.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("read dir: %w", err)
	}

	var paths []string
	for _, file := range files {
		if file.IsDir() {
			// Recursively calls Dirwalk in the case of a directory
			p, err := DirWalk(filepath.Join(dir, file.Name()))
			if err != nil {
				return nil, fmt.Errorf("dirwalk %s: %w", filepath.Join(dir, file.Name()), err)
			}
			// Merge into the caller's "paths" variable.
			paths = append(paths, p...)
			continue
		}
		// Now that we've reached a leaf (file) in the directory tree, we'll add it to "paths" variable.
		paths = append(paths, filepath.Join(dir, file.Name()))
	}

	return paths, nil
}
