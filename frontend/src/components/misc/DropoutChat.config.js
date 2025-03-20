export const system_prompt = `From the following code identify the the elements the user is trying to identify. Return the elements that need to be highlighted, in json format that contains the element's tag, textContent and unique set of attributes, which should be in a dictionary.

Use the following example as the format for an element that has class and href as unique attribute set. As the output only return the JSON data that must be in the following format. Always return as a JSON list, even when singular element is returned. Limit to 1 element unless it's a multi-step process.
[
  {
    attributes: [
        class: "main-container",
        href: "/link/to/something",
    },
    tag: "a",
    textContent: "Lorem Epsum",
  }
]`