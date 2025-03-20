/**
 * Main: Clean HTML by keeping only body content and removing all SVG elements
 *
 * @param {Element} domElement - Input DOM element
 * @returns {string} Cleaned HTML string
 */
export function cleanHtmlText(domElement) {
	if (!domElement) return null;

	// Create a clone to avoid modifying the original
	const doc = domElement.cloneNode(true);

	// Keep only the body content if it exists
	const body = doc.querySelector('body');
	if (body) {
		// Clear the document and append only the body content
		while (doc.firstChild) {
			doc.removeChild(doc.firstChild);
		}
		doc.appendChild(body);
	}

	// Remove all SVG elements
	doc.querySelectorAll('svg').forEach(svg => svg.remove());

	return doc.outerHTML
        .replace(/>\s+</g, '><') // Remove whitespace between tags 
        .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
        .trim();
}

// Example usage with the entire document
// const element = document.documentElement; 
// const cleanedHtml = cleanHtmlText(element);
// console.log(cleanedHtml);
