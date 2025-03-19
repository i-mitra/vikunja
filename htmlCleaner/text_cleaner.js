/**
 * Main: Clean HTML string by removing unnecessary tags and attributes
 *
 * @param {string} htmlContent - Input HTML string
 * @returns {string} Cleaned HTML string
 */
function cleanHtmlText(htmlContent) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(htmlContent, "text/html");

	if (!doc) return null;

	// Remove unwanted elements
	['style', 'script'].forEach(tag => {
		doc.querySelectorAll(tag).forEach(el => el.remove());
	});

	// Clean attributes
	doc.querySelectorAll('*').forEach(el => {
		const classValue = el.getAttribute("class");
		const vueIds = Array.from(el.attributes)
			.filter(attr => attr.name.startsWith("data-v-"))
			.map(attr => ({name: attr.name, value: attr.value}));
			
		// Remove all attributes
		while (el.attributes.length) {
			el.removeAttribute(el.attributes[0].name);
		}

		// Keep only what we need
		if (classValue) el.setAttribute("class", classValue);
		vueIds.forEach(attr => el.setAttribute(attr.name, attr.value));
	});

	return doc.documentElement.outerHTML;
}

// Example usage:
// Get and clean the current page's HTML
// const cleanedHtml = cleanHtmlText(document.documentElement.outerHTML);

// Log to the console
// console.log("Cleaned HTML:");
// console.log(cleanedHtml);

// You can also open it in a new window
// const newWindow = window.open();
// newWindow.document.write(cleanedHtml);
