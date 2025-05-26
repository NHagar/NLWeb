/**
 * NewsArticleRenderer Class
 * Handles rendering NewsArticle schema.org objects into a user-friendly HTML format.
 */
export class NewsArticleRenderer {
    /**
     * Creates a new NewsArticleRenderer instance.
     * @param {object} [options={}] - Configuration options for the renderer.
     * @param {boolean} [options.showImage=true] - Whether to display the article image.
     * @param {boolean} [options.showDescription=true] - Whether to display the article description.
     * @param {boolean} [options.showPublisher=true] - Whether to display the publisher.
     * @param {boolean} [options.showPublishedDate=true] - Whether to display the publication date.
     * @param {boolean} [options.showAuthor=false] - Whether to display the author(s).
     */
    constructor(options = {}) {
        this.options = {
            showImage: true,
            showDescription: true,
            showPublisher: true,
            showPublishedDate: true,
            showAuthor: false,
            ...options,
        };
    }

    /**
     * Types that this renderer can handle.
     * @returns {string[]} - An array of schema.org types this renderer supports.
     */
    static get supportedTypes() {
        return ["NewsArticle", "Article"]; // Can also handle generic Article
    }

    /**
     * Renders a single news article item into an HTML element.
     * @param {object} item - The news article data object, typically from search results.
     * Expected to have a `schema_object` property containing the NewsArticle data.
     * @returns {HTMLElement} - The HTML element representing the rendered news article.
     */
    render(item) {
        const articleData = item.schema_object || item; // Handle cases where schema_object might not be present

        // --- Main Card Container ---
        const card = document.createElement('article');
        card.className = 'news-article-card bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out w-full';

        // --- Image Section (Optional) ---
        let imageElement = '';
        if (this.options.showImage && articleData.image) {
            const imageUrl = this.extractImageUrl(articleData.image);
            if (imageUrl) {
                imageElement = `
                    <div class="w-full h-48 sm:h-56 md:h-64 bg-gray-200 dark:bg-gray-700">
                        <img src="${this.sanitizeUrl(imageUrl)}" alt="${this.escapeHtml(articleData.headline || 'Article image')}"
                             class="w-full h-full object-cover"
                             onerror="this.onerror=null; this.src='https://placehold.co/600x400/e2e8f0/94a3b8?text=Image+Not+Found';">
                    </div>
                `;
            }
        }
        card.innerHTML += imageElement;

        // --- Content Section ---
        const contentDiv = document.createElement('div');
        contentDiv.className = 'p-4 sm:p-6';

        // --- Headline ---
        if (articleData.headline) {
            const headlineLink = document.createElement('a');
            headlineLink.href = this.sanitizeUrl(articleData.url || '#');
            headlineLink.target = '_blank';
            headlineLink.rel = 'noopener noreferrer';
            headlineLink.className = 'news-article-headline block text-xl sm:text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200';
            headlineLink.textContent = this.escapeHtml(articleData.headline);
            contentDiv.appendChild(headlineLink);
        }

        // --- Meta Information (Publisher, Date) ---
        const metaDiv = document.createElement('div');
        metaDiv.className = 'news-article-meta text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 mb-3 flex flex-wrap items-center gap-x-3 gap-y-1';

        if (this.options.showPublisher && articleData.publisher && articleData.publisher.name) {
            const publisherSpan = document.createElement('span');
            publisherSpan.className = 'news-article-publisher font-medium text-gray-700 dark:text-gray-300';
            publisherSpan.textContent = this.escapeHtml(articleData.publisher.name);
            metaDiv.appendChild(publisherSpan);
        }

        if (this.options.showPublishedDate && articleData.datePublished) {
            if (metaDiv.children.length > 0) {
                const separator = document.createElement('span');
                separator.textContent = '•';
                metaDiv.appendChild(separator);
            }
            const dateSpan = document.createElement('span');
            dateSpan.className = 'news-article-date';
            dateSpan.textContent = this.formatDate(articleData.datePublished);
            metaDiv.appendChild(dateSpan);
        }
        if (metaDiv.children.length > 0) {
            contentDiv.appendChild(metaDiv);
        }

        // --- Author (Optional) ---
        if (this.options.showAuthor && articleData.author) {
            const authorText = this.extractAuthorName(articleData.author);
            if (authorText) {
                const authorP = document.createElement('p');
                authorP.className = 'news-article-author text-sm text-gray-600 dark:text-gray-400 mt-1';
                authorP.innerHTML = `By <span class="font-medium">${this.escapeHtml(authorText)}</span>`;
                contentDiv.appendChild(authorP);
            }
        }

        // --- Description/Snippet (Optional) ---
        if (this.options.showDescription && (articleData.description || articleData.articleBody)) {
            const descriptionP = document.createElement('p');
            descriptionP.className = 'news-article-description text-sm sm:text-base text-gray-700 dark:text-gray-300 mt-3 leading-relaxed';
            let descriptionText = articleData.description || articleData.articleBody;
            descriptionP.textContent = this.truncateText(this.stripHtml(this.escapeHtml(descriptionText)), 200);
            contentDiv.appendChild(descriptionP);
        }

        // --- Read More Link (if URL exists) ---
        if (articleData.url) {
            const readMoreLink = document.createElement('a');
            readMoreLink.href = this.sanitizeUrl(articleData.url);
            readMoreLink.target = '_blank';
            readMoreLink.rel = 'noopener noreferrer';
            readMoreLink.className = 'news-article-readmore inline-block mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200';
            readMoreLink.textContent = 'Read more →';
            contentDiv.appendChild(readMoreLink);
        }

        card.appendChild(contentDiv);
        return card;
    }

    /**
     * Extracts a usable image URL from various schema.org image formats.
     * @param {string|object|array} imageData - The image data from schema.org.
     * @returns {string|null} - The image URL or null if not found.
     */
    extractImageUrl(imageData) {
        if (typeof imageData === 'string') {
            return imageData;
        }
        if (Array.isArray(imageData) && imageData.length > 0) {
            return this.extractImageUrl(imageData[0]); // Process the first item in the array
        }
        if (typeof imageData === 'object' && imageData !== null) {
            if (imageData.url && typeof imageData.url === 'string') {
                return imageData.url;
            }
            if (imageData.contentUrl && typeof imageData.contentUrl === 'string') {
                return imageData.contentUrl;
            }
        }
        return null;
    }

    /**
     * Extracts author name(s) from schema.org author data.
     * @param {object|array} authorData - The author data.
     * @returns {string|null} - Formatted author name(s) or null.
     */
    extractAuthorName(authorData) {
        if (!authorData) return null;
        if (Array.isArray(authorData)) {
            return authorData.map(a => (typeof a === 'string' ? a : a.name)).filter(Boolean).join(', ');
        }
        if (typeof authorData === 'object' && authorData.name) {
            return authorData.name;
        }
        if (typeof authorData === 'string') {
            return authorData;
        }
        return null;
    }

    /**
     * Formats a date string into a more readable format.
     * @param {string} dateString - The ISO date string.
     * @returns {string} - Formatted date string (e.g., "May 26, 2025").
     */
    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
            return dateString; // Fallback to original string if parsing fails
        }
    }

    /**
     * Truncates text to a specified maximum length, adding an ellipsis.
     * @param {string} text - The text to truncate.
     * @param {number} maxLength - The maximum length before truncating.
     * @returns {string} - The truncated text.
     */
    truncateText(text, maxLength = 200) {
        if (!text || typeof text !== 'string') return '';
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength).trim() + '...';
    }

    /**
     * Basic HTML stripper.
     * @param {string} htmlString - The HTML string.
     * @returns {string} - Text content.
     */
    stripHtml(htmlString) {
        if (typeof document !== 'undefined') { // Check if document is available (for browser environment)
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlString;
            return tempDiv.textContent || tempDiv.innerText || "";
        } else { // Fallback for non-browser environments (simple regex, less robust)
            return htmlString.replace(/<[^>]+>/g, '');
        }
    }

    /**
     * Escapes HTML special characters in a string.
     * @param {string} str - The string to escape.
     * @returns {string} - The escaped string.
     */
    escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Sanitizes a URL to prevent XSS and ensure it's a valid HTTP/HTTPS URL.
     * @param {string} url - The URL to sanitize.
     * @returns {string} - The sanitized URL or '#' if invalid.
     */
    sanitizeUrl(url) {
        if (!url || typeof url !== 'string') return '#';
        const trimmedUrl = url.trim();
        if (/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(trimmedUrl)) {
            return trimmedUrl;
        }
        return '#'; // Return a safe placeholder for invalid URLs
    }
}

/**
 * Helper function to register the NewsArticleRenderer with a JsonRenderer instance.
 * @param {JsonRenderer} jsonRendererInstance - An instance of the main JsonRenderer.
 */
export function registerNewsArticleRenderer(jsonRendererInstance) {
    if (jsonRendererInstance && typeof jsonRendererInstance.registerTypeRenderer === 'function') {
        const newsRenderer = new NewsArticleRenderer();
        NewsArticleRenderer.supportedTypes.forEach(type => {
            jsonRendererInstance.registerTypeRenderer(type, (item) => newsRenderer.render(item));
        });
        console.log("NewsArticleRenderer registered.");
    } else {
        console.error("Failed to register NewsArticleRenderer: Invalid JsonRenderer instance provided.");
    }
}
