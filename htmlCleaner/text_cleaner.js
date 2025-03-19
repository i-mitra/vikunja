/**
 * Main: Clean HTML string by removing unnecessary tags and attributes
 *
 * @param {string} htmlContent - Input HTML string
 * @returns {string} Cleaned HTML string
 */
function cleanHtmlText(htmlContent) {
	// Create a DOM parser
	const parser = new DOMParser();
	const doc = parser.parseFromString(htmlContent, "text/html");

	if (!doc) {
		return null;
	}

	// Clean tags
	removeElements(doc.querySelectorAll("style"));
	removeElements(doc.querySelectorAll("script"));

	// Remove path elements within SVG tags
	doc.querySelectorAll("svg").forEach((svg) => {
		removeElements(svg.querySelectorAll("path"));
	});

	// Clean attributes
	cleanAttributes(doc.querySelectorAll("*"));

	// Return cleaned HTML as string
	return new XMLSerializer().serializeToString(doc);
}

/**
 * Helper function to remove elements from DOM
 *
 * @param {NodeList} elements - Elements to remove
 */
function removeElements(elements) {
	elements.forEach((element) => {
		element.parentNode.removeChild(element);
	});
}

/**
 * Helper function to clean attributes from elements
 *
 * @param {NodeList} elements - Elements to clean attributes from
 */
function cleanAttributes(elements) {
	elements.forEach((element) => {
		// Save the attributes we want to keep
		const classValue = element.getAttribute("class");

		// Create an array of Vue.js identifiers (data-v-*)
		const vueIdentifiers = [];
		for (let i = 0; i < element.attributes.length; i++) {
			const attr = element.attributes[i];
			if (attr.name.startsWith("data-v-")) {
				vueIdentifiers.push({ name: attr.name, value: attr.value });
			}
		}

		// Remove all attributes
		while (element.attributes.length > 0) {
			element.removeAttribute(element.attributes[0].name);
		}

		// Add back the class attribute if it existed
		if (classValue) {
			element.setAttribute("class", classValue);
		}

		// Add back the Vue.js identifiers
		vueIdentifiers.forEach((attr) => {
			element.setAttribute(attr.name, attr.value);
		});
	});
}

// Example usage:
// Get and clean the current page's HTML
// const cleanedHtml = cleanHtmlText(document.documentElement.outerHTML);

// Log to the console
// console.log("Cleaned HTML:");
// console.log(cleanedHtml);

// You can also open it in a new window
const newWindow = window.open();
newWindow.document.write('<html><head><title>Cleaned HTML</title><style>body{font-family:monospace;white-space:pre-wrap;}</style></head><body></body></html>');
newWindow.document.body.textContent = cleanedHtml;
