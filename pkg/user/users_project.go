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

package user

import (
	"strings"

	"code.vikunja.io/api/pkg/db"

	"xorm.io/builder"
	"xorm.io/xorm"
	"xorm.io/xorm/schemas"
)

type ProjectUserOpts struct {
	AdditionalCond              builder.Cond
	ReturnAllIfNoSearchProvided bool
	MatchFuzzily                bool
}

// ProjectUsers returns a project with all users, filtered by an optional search string
func ProjectUsers(s *xorm.Session, search string, opts *ProjectUserOpts) (users []*User, err error) {
	if opts == nil {
		opts = &ProjectUserOpts{}
	}

	// Prevent searching for placeholders
	search = strings.ReplaceAll(search, "%", "")

	if (search == "" || strings.ReplaceAll(search, " ", "") == "") && !opts.ReturnAllIfNoSearchProvided {
		return
	}

	conds := []builder.Cond{}

	if search != "" {
		for _, queryPart := range strings.Split(search, ",") {

			if opts.MatchFuzzily {
				conds = append(conds,
					db.ILIKE("name", queryPart),
					db.ILIKE("username", queryPart),
					db.ILIKE("email", queryPart),
				)
				continue
			}

			var usernameCond builder.Cond = builder.Eq{"username": queryPart}
			if db.Type() == schemas.POSTGRES {
				usernameCond = builder.Expr("username ILIKE ?", queryPart)
			}
			if db.Type() == schemas.SQLITE {
				usernameCond = builder.Expr("username = ? COLLATE NOCASE", queryPart)
			}

			conds = append(conds,
				usernameCond,
				builder.And(
					builder.Eq{"email": queryPart},
					builder.Eq{"discoverable_by_email": true},
				),
				builder.And(
					db.ILIKE("name", queryPart),
					builder.Eq{"discoverable_by_name": true},
				),
			)
		}
	}

	cond := builder.Or(conds...)

	if opts.AdditionalCond != nil {
		cond = builder.And(
			cond,
			opts.AdditionalCond,
		)
	}

	err = s.
		Where(cond).
		Find(&users)

outer:
	for _, u := range users {
		for _, part := range strings.Split(search, ",") {
			if u.Email == part {
				continue outer
			}
		}
		u.Email = ""
	}
	return
}

// ListAllUsers returns all users
func ListAllUsers(s *xorm.Session) (users []*User, err error) {
	err = s.Find(&users)
	return
}
