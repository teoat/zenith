function handler(event) {
    var request = event.request;
    var headers = request.headers;

    // Get client geolocation
    var country = headers['cloudfront-viewer-country'] ? headers['cloudfront-viewer-country'].value : '';

    // Regional routing logic
    var regionRedirects = {
        // EU countries
        'DE': '/eu',
        'FR': '/eu',
        'GB': '/eu',
        'IT': '/eu',
        'ES': '/eu',
        'NL': '/eu',
        'BE': '/eu',
        'AT': '/eu',
        'CH': '/eu',

        // Asia Pacific countries
        'JP': '/asia',
        'KR': '/asia',
        'SG': '/asia',
        'AU': '/asia',
        'NZ': '/asia',
        'TH': '/asia',
        'MY': '/asia',
        'ID': '/asia',
        'PH': '/asia',
        'VN': '/asia'
    };

    // Check if user is in a specific region
    if (regionRedirects[country]) {
        // Add regional preference header
        headers['x-regional-preference'] = { value: regionRedirects[country] };
    }

    // Default to US/global
    headers['x-regional-preference'] = headers['x-regional-preference'] || { value: '/us' };

    return request;
}