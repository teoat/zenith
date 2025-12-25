function handler(event) {
    var request = event.request;
    var headers = request.headers;

    // Get geolocation
    var country = headers['cloudfront-viewer-country'] ? headers['cloudfront-viewer-country'].value : '';

    // Basic bot detection
    var userAgent = headers['user-agent'] ? headers['user-agent'].value : '';

    // Known bot patterns
    var botPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /headless/i,
        /selenium/i,
        /puppeteer/i
    ];

    var isBot = botPatterns.some(pattern => pattern.test(userAgent));

    if (isBot) {
        // Block suspicious requests
        return {
            statusCode: 403,
            statusDescription: 'Forbidden',
            headers: {
                'x-blocked-reason': { value: 'bot-detection' }
            }
        };
    }

    // Add custom headers for analytics
    headers['x-client-country'] = { value: country };
    headers['x-request-processed'] = { value: 'true' };

    return request;
}