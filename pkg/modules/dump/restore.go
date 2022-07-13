// Vikunja is a to-do list application to facilitate your life.
// Copyright 2018-2021 Vikunja and contributors. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public Licensee as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public Licensee for more details.
//
// You should have received a copy of the GNU Affero General Public Licensee
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

package dump

import (
	"archive/zip"
	"bufio"
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"sort"
	"strconv"
	"strings"

	"code.vikunja.io/api/pkg/db"
	"code.vikunja.io/api/pkg/files"
	"code.vikunja.io/api/pkg/initialize"
	"code.vikunja.io/api/pkg/log"
	"code.vikunja.io/api/pkg/migration"

	"src.techknowlogick.com/xormigrate"
)

const maxConfigSize = 5 * 1024 * 1024 // 5 MB, should be largely enough

// Restore takes a zip file name and restores it
func Restore(filename string) error {

	r, err := zip.OpenReader(filename)
	if err != nil {
		return fmt.Errorf("could not open zip file: %w", err)
	}

	log.Warning("Restoring a dump will wipe your current installation!")
	log.Warning("To confirm, please type 'Yes, I understand' and confirm with enter:")
	cr := bufio.NewReader(os.Stdin)
	text, err := cr.ReadString('\n')
	if err != nil {
		return fmt.Errorf("could not read confirmation message: %w", err)
	}
	if text != "Yes, I understand\n" {
		return fmt.Errorf("invalid confirmation message")
	}

	// Find the configFile, database and files files
	var configFile *zip.File
	var dotEnvFile *zip.File
	dbfiles := make(map[string]*zip.File)
	filesFiles := make(map[string]*zip.File)
	for _, file := range r.File {
		if strings.HasPrefix(file.Name, "config") {
			configFile = file
			continue
		}
		if strings.HasPrefix(file.Name, "database/") {
			fname := strings.ReplaceAll(file.Name, "database/", "")
			dbfiles[fname[:len(fname)-5]] = file
			continue
		}
		if file.Name == ".env" {
			dotEnvFile = file
			continue
		}
		if strings.HasPrefix(file.Name, "files/") {
			filesFiles[strings.ReplaceAll(file.Name, "files/", "")] = file
		}
	}

	///////
	// Restore the config file
	err = restoreConfig(configFile, dotEnvFile)
	if err != nil {
		return err
	}
	log.Info("Restoring...")

	// Init the configFile again since the restored configuration is most likely different from the one before
	initialize.LightInit()
	initialize.InitEngines()
	files.InitFileHandler()

	///////
	// Restore the db
	// Start by wiping everything
	if err := db.WipeEverything(); err != nil {
		return fmt.Errorf("could not wipe database: %w", err)
	}
	log.Info("Wiped database.")

	// Because we don't explicitly saved the table definitions, we take the last ran db migration from the dump
	// and execute everything until that point.
	migrations := dbfiles["migration"]
	rc, err := migrations.Open()
	if err != nil {
		return fmt.Errorf("could not open migrations: %w", err)
	}
	defer rc.Close()

	var buf bytes.Buffer
	if _, err := buf.ReadFrom(rc); err != nil {
		return fmt.Errorf("could not read migrations: %w", err)
	}

	ms := []*xormigrate.Migration{}
	if err := json.Unmarshal(buf.Bytes(), &ms); err != nil {
		return fmt.Errorf("could not read migrations: %w", err)
	}
	sort.Slice(ms, func(i, j int) bool {
		return ms[i].ID < ms[j].ID
	})

	lastMigration := ms[len(ms)-2]
	log.Debugf("Last migration: %s", lastMigration.ID)
	if err := migration.MigrateTo(lastMigration.ID, nil); err != nil {
		return fmt.Errorf("could not create db structure: %w", err)
	}

	delete(dbfiles, "migration")

	// Restore all db data
	for table, d := range dbfiles {
		content, err := unmarshalFileToJSON(d)
		if err != nil {
			return fmt.Errorf("could not read table %s: %w", table, err)
		}

		// FIXME: There has to be a general way to do this but this works for now.
		if table == "notifications" {
			for i := range content {
				decoded, err := base64.StdEncoding.DecodeString(content[i]["notification"].(string))
				if err != nil {
					return fmt.Errorf("could not decode notification %s: %w", content[i]["notification"], err)
				}

				content[i]["notification"] = string(decoded)
			}
		}

		if err := db.Restore(table, content); err != nil {
			return fmt.Errorf("could not restore table data for table %s: %w", table, err)
		}
		log.Infof("Restored table %s", table)
	}
	log.Infof("Restored %d tables", len(dbfiles))

	// Run migrations again to migrate a potentially outdated dump
	migration.Migrate(nil)

	///////
	// Restore Files
	for i, file := range filesFiles {
		id, err := strconv.ParseInt(i, 10, 64)
		if err != nil {
			return fmt.Errorf("could not parse file id %s: %w", i, err)
		}

		f := &files.File{ID: id}

		fc, err := file.Open()
		if err != nil {
			return fmt.Errorf("could not open file %s: %w", i, err)
		}

		if err := f.Save(fc); err != nil {
			return fmt.Errorf("could not save file: %w", err)
		}

		_ = fc.Close()
		log.Infof("Restored file %s", i)
	}
	log.Infof("Restored %d files.", len(filesFiles))

	///////
	// Done
	log.Infof("Done restoring dump.")
	log.Infof("Restart Vikunja to make sure the new configuration file is applied.")

	return nil
}

func unmarshalFileToJSON(file *zip.File) (contents []map[string]interface{}, err error) {
	rc, err := file.Open()
	if err != nil {
		return
	}
	defer rc.Close()

	var buf bytes.Buffer
	if _, err := buf.ReadFrom(rc); err != nil {
		return nil, err
	}

	contents = []map[string]interface{}{}
	if err := json.Unmarshal(buf.Bytes(), &contents); err != nil {
		return nil, err
	}
	return
}

func restoreConfig(configFile, dotEnvFile *zip.File) error {
	if configFile != nil {
		if configFile.UncompressedSize64 > maxConfigSize {
			return fmt.Errorf("config file too large, is %d, max size is %d", configFile.UncompressedSize64, maxConfigSize)
		}

		outFile, err := os.OpenFile(configFile.Name, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, configFile.Mode())
		if err != nil {
			return fmt.Errorf("could not open config file for writing: %w", err)
		}

		cfgr, err := configFile.Open()
		if err != nil {
			return err
		}

		// #nosec - We eliminated the potential decompression bomb by erroring out above if the file is larger than a threshold.
		_, err = io.Copy(outFile, cfgr)
		if err != nil {
			return fmt.Errorf("could not create config file: %w", err)
		}

		_ = cfgr.Close()
		_ = outFile.Close()

		log.Infof("The config file has been restored to '%s'.", configFile.Name)
		log.Infof("You can now make changes to it, hit enter when you're done.")
		if _, err := bufio.NewReader(os.Stdin).ReadString('\n'); err != nil {
			return fmt.Errorf("could not read from stdin: %w", err)
		}

		return nil
	}

	log.Warning("No config file found, not restoring one.")
	log.Warning("You'll likely have had Vikunja configured through environment variables.")

	if dotEnvFile != nil {
		dotenv, err := dotEnvFile.Open()
		if err != nil {
			return err
		}
		buf := bytes.Buffer{}
		_, err = buf.ReadFrom(dotenv)
		if err != nil {
			return err
		}

		log.Warningf("Please make sure the following settings are properly configured in your instance:\n%s", buf.String())
		log.Warning("Make sure your current config matches the following env variables, confirm by pressing enter when done.")
		log.Warning("If your config does not match, you'll have to make the changes and restart the restoring process afterwards.")
		if _, err := bufio.NewReader(os.Stdin).ReadString('\n'); err != nil {
			return fmt.Errorf("could not read from stdin: %w", err)
		}
	}

	return nil
}
