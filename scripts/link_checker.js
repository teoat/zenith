#!/usr/bin/env node

/**
 * Automated Link Checker
 * Validates all links in documentation and code for accessibility
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class LinkChecker {
    constructor() {
        this.checkedLinks = new Map();
        this.brokenLinks = [];
        this.validLinks = [];
        this.timeout = 5000; // Reduced timeout for better performance
        this.cache = new Map();
        this.cacheExpiry = 10 * 60 * 1000; // 10 minutes cache
    }

    /**
     * Check all links in documentation files
     */
    async checkDocumentationLinks() {
        console.log('🔗 Checking documentation links...');

        const docsDir = path.join(__dirname, '..', 'docs');
        const files = this.getAllMarkdownFiles(docsDir);

        // Process files in parallel batches for better performance
        const batchSize = 5;
        const linkPromises = [];

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            const links = this.extractLinks(content);

            // Batch link checks for each file
            for (const link of links) {
                linkPromises.push(this.checkLink(link, file));
            }

            // Process in batches to avoid overwhelming the network
            if (linkPromises.length >= batchSize) {
                await Promise.allSettled(linkPromises.splice(0, batchSize));
            }
        }

        // Process remaining links
        if (linkPromises.length > 0) {
            await Promise.allSettled(linkPromises);
        }

        this.printResults();
    }

    /**
     * Extract links from markdown content
     */
    extractLinks(content) {
        const links = [];
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            const [, text, url] = match;
            links.push({ text, url, type: 'markdown' });
        }

        // Also check for bare URLs
        const urlRegex = /https?:\/\/[^\s<>"']+/g;
        while ((match = urlRegex.exec(content)) !== null) {
            const url = match[0];
            // Skip localhost and internal URLs
            if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
                links.push({ text: url, url, type: 'bare' });
            }
        }

        return links;
    }

    /**
     * Check if a link is accessible
     */
    async checkLink(link, file) {
        const { url } = link;

        // Skip if already checked
        if (this.checkedLinks.has(url)) {
            return;
        }

        this.checkedLinks.set(url, true);

        // Check cache first
        const cacheKey = url;
        const cached = this.cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
            if (cached.isValid) {
                this.validLinks.push({ url, file });
            } else {
                this.brokenLinks.push({ url, file, error: cached.error });
            }
            return;
        }

        try {
            const isValid = await this.validateUrl(url);
            // Cache the result
            this.cache.set(cacheKey, {
                isValid,
                error: isValid ? null : 'HTTP error',
                timestamp: Date.now()
            });

            if (isValid) {
                this.validLinks.push({ url, file });
                console.log(`✅ ${url}`);
            } else {
                this.brokenLinks.push({ url, file, error: 'HTTP error' });
                console.log(`❌ ${url} (in ${path.relative(process.cwd(), file)})`);
            }
        } catch (error) {
            // Cache the error
            this.cache.set(cacheKey, {
                isValid: false,
                error: error.message,
                timestamp: Date.now()
            });

            this.brokenLinks.push({ url, file, error: error.message });
            console.log(`❌ ${url} - ${error.message} (in ${path.relative(process.cwd(), file)})`);
        }
    }

    /**
     * Validate URL accessibility
     */
    validateUrl(url) {
        return new Promise((resolve) => {
            const client = url.startsWith('https') ? https : http;

            const req = client.request(url, { method: 'HEAD' }, (res) => {
                resolve(res.statusCode && res.statusCode < 400);
            });

            req.on('error', () => resolve(false));
            req.setTimeout(this.timeout, () => {
                req.destroy();
                resolve(false);
            });

            req.end();
        });
    }

    /**
     * Get all markdown files recursively
     */
    getAllMarkdownFiles(dir) {
        const files = [];

        function traverse(currentDir) {
            const items = fs.readdirSync(currentDir);

            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                try {
                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                        traverse(fullPath);
                    } else if (stat.isFile() && item.endsWith('.md')) {
                        files.push(fullPath);
                    }
                } catch (e) {
                    console.warn(`⚠️ Could not stat ${fullPath}: ${e.message}`);
                }
            }
        }

        traverse(dir);
        return files;
    }

    /**
     * Print results
     */
    printResults() {
        console.log('\n📊 Link Check Results:\n');

        console.log(`Total links checked: ${this.checkedLinks.size}`);
        console.log(`Valid links: ${this.validLinks.length}`);
        console.log(`Broken links: ${this.brokenLinks.length}`);

        if (this.brokenLinks.length > 0) {
            console.log('\n❌ Broken Links:');
            this.brokenLinks.forEach((link, index) => {
                console.log(`  ${index + 1}. ${link.url}`);
                console.log(`     File: ${path.relative(process.cwd(), link.file)}`);
                console.log(`     Error: ${link.error}`);
            });
        }

        console.log(`\n🎯 Success Rate: ${((this.validLinks.length / this.checkedLinks.size) * 100).toFixed(1)}%`);
    }
}

// Run the link checker if this script is executed directly
if (require.main === module) {
    const checker = new LinkChecker();
    checker.checkDocumentationLinks().then(() => {
        const exitCode = checker.brokenLinks.length > 0 ? 1 : 0;
        process.exit(exitCode);
    }).catch(error => {
        console.error('Link check failed:', error);
        process.exit(1);
    });
}

module.exports = LinkChecker;