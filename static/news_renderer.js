/**
 * NewsArticleRenderer Class
 * Handles rendering NewsArticle schema.org objects into a user-friendly HTML format.
 * Adjusted for scores as integers from 0 to 100.
 */
console.log("Loading NewsArticleRenderer...");
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
        console.log("--- NewsArticleRenderer CONSTRUCTOR called ---", options); // <-- ADD THIS

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
     * @param {object} item - The news article data object.
     * Expected to have `schema_object` and `score` (integer 0-100).
     * @returns {HTMLElement} - The HTML element representing the rendered news article.
     */
    render(item) {
        const articleData = item.schema_object || item;
        console.log("Rendering NewsArticle:", articleData);
        console.log("Article score (0-100 scale):", item.score);

        const card = document.createElement('article');
        card.className = 'news-article-card bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out w-full flex flex-col';

        let imageElementHtml = '';
        if (this.options.showImage && articleData.image) {
            const imageUrl = this.extractImageUrl(articleData.image);
            if (imageUrl) {
                imageElementHtml = `
                    <div class="w-full h-48 sm:h-56 md:h-64 bg-gray-200 dark:bg-gray-700">
                        <img src="${this.sanitizeUrl(imageUrl)}" alt="${this.escapeHtml(articleData.headline || 'Article image')}"
                             class="w-full h-full object-cover"
                             onerror="this.onerror=null; this.src='https://placehold.co/600x400/e2e8f0/94a3b8?text=Image+Not+Found';">
                    </div>
                `;
            }
        }
        // Prepend image if it exists, otherwise it won't be added
        if (imageElementHtml) card.innerHTML += imageElementHtml;


        const contentDiv = document.createElement('div');
        contentDiv.className = 'p-4 sm:p-6 flex-grow flex flex-col'; // flex-grow to push footer down

        if (articleData.headline) {
            const headlineLink = document.createElement('a');
            headlineLink.href = this.sanitizeUrl(articleData.url || '#');
            headlineLink.target = '_blank';
            headlineLink.rel = 'noopener noreferrer';
            headlineLink.className = 'news-article-headline block text-xl sm:text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 mb-1';
            headlineLink.textContent = this.escapeHtml(articleData.headline);
            contentDiv.appendChild(headlineLink);
        }

        // --- Score Display (Adjusted for 0-100 integer scores) ---
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'news-article-score flex items-center gap-2 mt-1 mb-2'; // Adjusted margins

        const scoreLabel = document.createElement('span');
        scoreLabel.className = 'text-xs font-medium text-gray-500 dark:text-gray-400';
        scoreLabel.textContent = 'Relevance:';

        const scoreValueSpan = document.createElement('span');
        const score = item.score;

        let scoreClass = 'text-xs font-mono px-2 py-1 rounded';
        // Adjusted color coding for 0-100 scale
        if (score >= 80) {
            scoreClass += ' bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
        } else if (score >= 60) {
            scoreClass += ' bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
        } else if (score >= 40) {
            scoreClass += ' bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
        } else {
            scoreClass += ' bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
        }

        scoreValueSpan.className = scoreClass;
        scoreValueSpan.textContent = score.toFixed(0); // Display as integer

        const scoreBar = document.createElement('div');
        scoreBar.className = 'flex-grow h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[60px]';
        const scoreBarFill = document.createElement('div');
        scoreBarFill.className = 'h-full transition-all duration-300';
        // Width is score directly as percentage
        scoreBarFill.style.width = `${Math.max(0, Math.min(100, score))}%`;

        if (score >= 80) {
            scoreBarFill.className += ' bg-green-500';
        } else if (score >= 60) {
            scoreBarFill.className += ' bg-yellow-500';
        } else if (score >= 40) {
            scoreBarFill.className += ' bg-orange-500';
        } else {
            scoreBarFill.className += ' bg-red-500';
        }

        scoreBar.appendChild(scoreBarFill);

        scoreDiv.appendChild(scoreLabel);
        scoreDiv.appendChild(scoreValueSpan);
        scoreDiv.appendChild(scoreBar);
        contentDiv.appendChild(scoreDiv);

        const metaDiv = document.createElement('div');
        metaDiv.className = 'news-article-meta text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3 flex flex-wrap items-center gap-x-3 gap-y-1';

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

        if (this.options.showAuthor && articleData.author) {
            const authorText = this.extractAuthorName(articleData.author);
            if (authorText) {
                const authorP = document.createElement('p');
                authorP.className = 'news-article-author text-sm text-gray-600 dark:text-gray-400 mt-1';
                authorP.innerHTML = `By <span class="font-medium">${this.escapeHtml(authorText)}</span>`;
                contentDiv.appendChild(authorP);
            }
        }

        // Description wrapper to allow for "Read more" to be pushed to the bottom
        const descriptionWrapper = document.createElement('div');
        descriptionWrapper.className = "flex-grow"; // This will take up available space

        if (this.options.showDescription && (articleData.description || articleData.articleBody)) {
            const descriptionP = document.createElement('p');
            descriptionP.className = 'news-article-description text-sm sm:text-base text-gray-700 dark:text-gray-300 mt-3 leading-relaxed';
            let descriptionText = articleData.description || articleData.articleBody;
            descriptionP.textContent = this.truncateText(this.stripHtml(this.escapeHtml(descriptionText)), 150); // Slightly shorter for balance
            descriptionWrapper.appendChild(descriptionP);
        }
        contentDiv.appendChild(descriptionWrapper);


        if (articleData.url) {
            const readMoreLink = document.createElement('a');
            readMoreLink.href = this.sanitizeUrl(articleData.url);
            readMoreLink.target = '_blank';
            readMoreLink.rel = 'noopener noreferrer';
            readMoreLink.className = 'news-article-readmore inline-block mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 self-start'; // self-start if contentDiv is flex-col
            contentDiv.appendChild(readMoreLink);
        }

        card.appendChild(contentDiv);
        return card;
    }

    extractImageUrl(imageData) {
        if (typeof imageData === 'string') return imageData;
        if (Array.isArray(imageData) && imageData.length > 0) return this.extractImageUrl(imageData[0]);
        if (typeof imageData === 'object' && imageData !== null) {
            if (imageData.url && typeof imageData.url === 'string') return imageData.url;
            if (imageData.contentUrl && typeof imageData.contentUrl === 'string') return imageData.contentUrl;
        }
        return null;
    }

    extractAuthorName(authorData) {
        if (!authorData) return null;
        if (Array.isArray(authorData)) return authorData.map(a => (typeof a === 'string' ? a : a.name)).filter(Boolean).join(', ');
        if (typeof authorData === 'object' && authorData.name) return authorData.name;
        if (typeof authorData === 'string') return authorData;
        return null;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
            return dateString;
        }
    }

    truncateText(text, maxLength = 150) {
        if (!text || typeof text !== 'string') return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    stripHtml(htmlString) {
        if (typeof document !== 'undefined') {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlString;
            return tempDiv.textContent || tempDiv.innerText || "";
        }
        return htmlString.replace(/<[^>]+>/g, '');
    }

    escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    sanitizeUrl(url) {
        if (!url || typeof url !== 'string') return '#';
        const trimmedUrl = url.trim();
        if (/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(trimmedUrl) || /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(trimmedUrl) || /^\//.test(trimmedUrl) || /^#/.test(trimmedUrl)) { // Allow relative, mailto, and fragment URLs
            return trimmedUrl;
        }
        // For other potentially unsafe protocols, return '#'
        if (!/^(ftp|file|javascript|data):/i.test(trimmedUrl)) {
            // If it's not a common safe protocol and not one of the explicitly allowed above, be cautious.
            // This is a basic check. For robust XSS protection, a library is better.
        }
        return '#'; // Fallback for anything not explicitly safe or recognized
    }
}

/**
 * Helper function to register the NewsArticleRenderer with a JsonRenderer instance.
 * This function is usually part of a larger rendering system.
 * If you are not using such a system, you can ignore this function and
 * instantiate NewsArticleRenderer directly as done in interface.html.
 * @param {object} jsonRendererInstance - An instance of the main JsonRenderer.
 */
export function registerNewsArticleRenderer(jsonRendererInstance) {
    if (jsonRendererInstance && typeof jsonRendererInstance.registerTypeRenderer === 'function') {
        const newsRenderer = new NewsArticleRenderer();
        NewsArticleRenderer.supportedTypes.forEach(type => {
            jsonRendererInstance.registerTypeRenderer(type, (item) => newsRenderer.render(item));
        });
        console.log("NewsArticleRenderer (0-100 scale) registered.");
    } else {
        // console.warn("Failed to register NewsArticleRenderer: Invalid JsonRenderer instance provided or not using a JsonRenderer system.");
    }
}
