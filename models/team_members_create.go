package models

// Create implements the create method to assign a user to a team
func (tm *TeamMember) Create(doer *User, id int64) (err error) {
	tm.TeamID = id
	_, err = x.Insert(tm)
	return
}
