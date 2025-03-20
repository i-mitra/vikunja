export const system_prompt = `From the following code identify the the elements the user is trying to identify. Return the elements that needs to be highlighted in json format that contains the element's unique set of sttributes, tag and textContent.

Use the following example as the format the highlighted element must be returned as.
{
    attributes: [
        class: "main-container",
        href: "/link/to/something",
    ],
    tag: "a",
    textContent: "Lorem Epsum",
}`