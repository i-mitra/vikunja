/**
 * Main: Clean HTML by removing unnecessary tags and attributes
 *
 * @param {Element} domElement - Input DOM element
 * @returns {string} Cleaned HTML string
 */
export function cleanHtmlText(domElement) {
	if (!domElement) return null;

	// Create a clone to avoid modifying the original
	const doc = domElement.cloneNode(true);

	// Remove unwanted elements: style, script, path
	['style', 'script', 'path'].forEach(tag => {
		doc.querySelectorAll(tag).forEach(el => el.remove());
	});

	// Clean attributes for each element
	doc.querySelectorAll('*').forEach(el => {
		const classValue = el.getAttribute("class");
		const idValue = el.getAttribute("id");
		const typeValue = el.getAttribute("type");
		const titleValue = el.getAttribute("title");
		const dataIconValue = el.getAttribute("data-icon");
		
		// Store direct text nodes only (not including child elements)
		const directTextContent = Array.from(el.childNodes)
			.filter(node => node.nodeType === 3) // Text nodes only
			.map(node => node.textContent)
			.join('');
			
		// Remove all attributes
		while (el.attributes.length) {
			el.removeAttribute(el.attributes[0].name);
		}

		// Keep only: class, id, type, title, data-icon
		if (classValue) el.setAttribute("class", classValue);
		if (idValue) el.setAttribute("id", idValue);
		if (typeValue) el.setAttribute("type", typeValue);
		if (titleValue) el.setAttribute("title", titleValue);
		if (dataIconValue) el.setAttribute("data-icon", dataIconValue);
		
		// Restore direct text content if it existed
		if (directTextContent && directTextContent.trim()) {
			// Find all direct text nodes and update their content
			Array.from(el.childNodes)
				.filter(node => node.nodeType === 3)
				.forEach(node => node.textContent = directTextContent);
		}
	});

	return doc.outerHTML
        .replace(/>\s+</g, '><') // ! Remove whitespace between tags 
        .replace(/\s{2,}/g, ' ') // ! Replace multiple spaces with single space
        .trim();
}

// Example usage with the entire document
// const element = document.documentElement; 
// const cleanedHtml = cleanHtmlText(element);
// console.log(cleanedHtml);
