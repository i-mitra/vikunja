export const system_prompt = `The processed html data in the user prompt is the current page the user is on. Help the user complete the action they're asking about, by identify the elements and related instructions the user needs to follow to complete the desired action. Only include necessary steps. Return the elements that need to be highlighted along with the related instruction, in json format that contains the element's tag, textContent and unique set of attributes, which must be a dictionary and not a list of objects.

Following is an example of the JSON formatted data that is expected to return when user action needs two steps instruction and the element related to those steps. Always return as a JSON list with a maximum of 5 items, even when singular element is returned. 

[
  {
    instruction: "Please type here.",
    attributes: {
        class: "main-container",
        href: "/link/to/something",
    },
    tag: "a",
    textContent: "Lorem Ipsum",
    textInput: "example@email.com"
  },
 {
    instruction: "Please click here.",
    attributes: {
        data-v-c89c46e2: "",
        type: "button",
    },
    tag: "a",
    textContent: "Lorem Ipsum"
  }
]

IMPORTANT: When the user's query includes text to be entered, you MUST include the textInput field in the JSON response with the text to be entered. The textInput field should contain the exact text that needs to be typed into the input field. Look for patterns like:
- "add [text] in [field]"
- "enter [text] in [field]"
- "fill [field] with [text]"
- "write [text] in [field]"
- "put [text] in [field]"

For example, if the user says "add a do laundry task", the response should look like:
[
  {
    instruction: "Please type "do laundry" here.",
    attributes: {
        class: "add-task-textarea",
        type: "textarea",
    },
    tag: "textarea",
    textContent: "",
    textInput: "do laundry"
  }
]

Remember: If the user's query includes text to be entered, you MUST include the textInput field with the exact text to be entered. This is crucial for the magic wand functionality to work correctly.`

export const other_pages_prompt = `Please use the information from the other pages to help you answer the user's question ONLY IF the answer lies on another page.`

// export const additional_other_pages_prompt = `If the answer lies on another page based on the saved text from other pages, please ONLY return a list containing only 1 json instruction with the FIRST PAGE CHANGE only, not directly going to the target page, but only the first PAGE CHANGE to navigate to the target page (no information about the target button, link, etc., only about the next button), with "multi_page": "true" in quotes if there are more steps required to complete the action.`
// export const additional_other_pages_prompt = `If the answer lies on another page, please ensure that multi_page is set to be true, then return all the steps to navigate to the target page.`
// export const additional_other_pages_prompt = `If the answer lies on another page, remember that you can only use the HTML elements from the CURRENT PAGE, one at a time, to navigate to the target page. Ensure that all steps include the exact names of the relevant HTML elements correctly. If the answer lies in a subpage within settings, for example, make sure to navigate to the settings page first, then to the subpage.`
export const additional_other_pages_prompt = `If the answer lies on another page, return the steps one at a time to navigate to the target page. Make an educated guess about the textContent fields of the relevant elements on the target page.`


export const saved_pages_prompt = `Here is an overview of what lies on other pages:
/login – Login Page
Fields: Username or Email Address, Password

Options:

"Forgot your password?"

"Stay logged in" (checkbox)

Button: "Login"

Link: "Create account"

Extras:

Keyboard Shortcuts


Prompt to add app to home screen

/ – Home / Current Tasks
Main Components:

Sidebar: Overview, Upcoming, Projects, Labels, Teams

User menu: Notifications, Settings, About, Logout

Project Actions:

"Mark this project as favorite"

"Open project settings menu" with options:

Edit

Views

Background settings

Share

Duplicate

Archive

Subscribe

Webhooks

Create project

Delete

Task View:

Task list with checkboxes and favorite buttons

Task Entry Field: "Add a task…" + "Add" button

Extras:

Keyboard Shortcuts



Prompt to add app to home screen

/tasks/by/upcoming – Upcoming Tasks
Date Range Filter:

Presets: Today, Last Week, This Week, Next Week, This Month, etc.

Manual: From [date] To [date]

Use date math syntax (info link provided)

Checkbox Filters:

Show tasks without dates

Show overdue tasks

Result Message: "Nothing to do — Have a nice day!"

Extras: Keyboard Shortcuts, , Add to home screen

/projects – Projects
Checkbox: "Show Archived"

Buttons:

"New Saved Filter"

"New Project"

Sidebar & Project Menu as above

Extras: Keyboard Shortcuts, , Add to home screen

/labels – Labels
Actions:

"New Label"

"Manage Labels" (shows message if no labels)

Extras: Same as above

/teams – Teams
Message: "You are currently not part of any teams. Create a team."

Button: "Create a team"

Extras: Same as above

/projects/1/0 – Project View (Current Tasks)
Project settings menu and sidebar as above

Task list displayed

Extras: Same as above

/projects/1/1 – Project View: Inbox
View Modes: Inbox, List, Gantt, Table, Kanban

Filters Panel

Task Input: "Add a task…" + "Add" button

Tasks listed with checkboxes and favorite buttons

Extras: Same as above

/projects/1/2 – Project View: Gantt with Date Range
View Modes and Sidebar as above

Filters:

Date Range calendar

"Show tasks without dates" (checkbox)

Create Task button present

Calendar-style display for months

Extras: Same as above

/projects/1/3 – Project View: Table
View Modes and Sidebar as above

Column Selection (checkboxes):

#, Done, Title, Priority, Labels, Assignees, Due Date, Start Date, End Date, Progress, Done At, Created, Updated, Created By

Filters Panel

Task Table with IDs and titles

Extras: Same as above

/projects/1/4 – Project View: Kanban
View Modes and Sidebar as above

Board Columns: Backlog with listed tasks

Buttons:

"Add another task"

"Create a bucket"

Extras: Same as above

/user/settings/general – General Settings
Settings Options:

Name

Default Project

Default View (List, Gantt, Table, Kanban)

Email Reminders (undone/overdue tasks)

Weekly Start Day

Language (many options)

Magic Mode

Color Scheme (Light, System, Dark)

Time Zone (dropdown with all options)

Sound on Task Completion

Team/Project Invitations via Name/Email

Extras: Save button, Keyboard Shortcuts, , Add to home screen

/user/settings/password-update – Update Password
Fields:

New Password

New Password Confirmation

Current Password

Button: "Save"

Extras: Same as above

/user/settings/email-update – Update Email
Fields:

New Email Address

Current Password

Button: "Save"

Extras: Same as above

/user/settings/avatar – Avatar
Options:

Default

Initials

Gravatar

Marble

Upload

Button: "Save"

Extras: Same as above

/user/settings/totp – Two-Factor Authentication
Action: "Enroll" button

Extras: Same as above

/user/settings/data-export – Export Data
Field: Current Password

Button: "Request a copy of my Vikunja Data"

Description: Exports all projects, tasks, etc.

Extras: Same as above

/user/settings/migrate – Import Data
Options:

Import from: Vikunja Export, TickTick

Instructions: Click service logo to begin

Extras: Same as above

/user/settings/caldav – CalDAV Integration
Instructions: Use generated URL for client setup

Token Section:

"Create a token" button

Link: "More information about CalDAV in Vikunja"

Extras: Same as above

/user/settings/api-tokens – API Tokens
Button: "Create a token"

Link: API documentation

Extras: Same as above

/user/settings/deletion – Delete Account
Warning: Action is permanent and irreversible

Field: Current Password

Button: "Delete my account"

Instruction: Email will be sent with next steps

Extras: Same as above

/about – About Page
Displays:

Application Version: v0.24.1-879-5e38c0f09c

"Close" button

Extras: Same as above


/tasks/3 – Task Detail View
Task Info Panel:

Task ID: #3, Title: AS, Project: Inbox

Priority Options: Unset, Low, Medium, High, Urgent, DO NOW

Date Fields:

Due Date: "Click here to set a due date"

Start Date: "Click here to set a start date"

Repeat Settings:

Intervals: Every Day, Week, 30 Days

Mode: Default, Monthly, From completion date

Units: Hours, Days, Weeks

Labels & Description Editor:

Text formatting tools: Heading 1–3, Bold, Italic, Underline, Strikethrough, Code, Quote

List options: Bullet, Ordered, Task

Additional: Image, Link, Horizontal Rule, Table, Undo, Redo

Buttons:

"Save"

"Add your reaction"

"Comment"

"Mark task done!"

"Unsubscribe"

"Add to Favorites"

Related Tasks:

Add Relation dropdown: Subtask, Parent, Related, Duplicates, Blocking, Blocked By, Precedes, Follows, Copied From, Copied To

"Add a New Task Relation"

Message: "No task relations yet."

Task Controls Menu:

Add Labels

Set Priority

Set Progress

Set Color

Assign to User

Add Attachments

Add Relation

Move

Set Due Date / Start Date / End Date / Reminders / Repeating Interval

Delete

Footer: Keyboard Shortcuts, , Add to Home Screen

/projects/new – New Project
Fields:

Title

Parent Project (dropdown)

Color (color picker)

Buttons:

"Cancel"

"Create"

Footer: Keyboard Shortcuts, , Add to Home Screen

/filters/new – New Saved Filter
Editor Panel:

Title

Description (with full text formatting options)

Filter Options:

Query Field

Date Options: Today, This Week, Last Month, In 30 Days, etc.

Checkbox: "Include Tasks which don't have a value set"

Buttons:

"Create saved filter"

Footer: Keyboard Shortcuts, , Add to Home Screen

/labels/new – Create Label
Fields:

Title

Color (color picker)

Buttons:

"Reset Color"

"Cancel"

"Create"

Footer: Keyboard Shortcuts, , Add to Home Screen

/teams/new – Create Team
Field:

Team Name

Buttons:

"Cancel"

"Create"

Footer: Keyboard Shortcuts, , Add to Home Screen

`