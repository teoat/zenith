import { secureLogger } from './secureLogger';

const verifyIntegrity = async (expectedHash: string) => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  try {
    const response = await fetch('/'); // Fetch the current index.html
    const text = await response.text();

    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const currentHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (currentHash !== expectedHash) {
      secureLogger.error('SECURITY', 'Integrity check failed: index.html has been tampered with!', { expectedHash, currentHash });
      document.body.textContent = 'Integrity check failed! The application may have been tampered with.';
      window.location.href = 'about:blank'; // Redirect to a blank page
    }
  } catch (error) {
    secureLogger.error('SECURITY', 'Error during integrity verification', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    // Potentially take action even on error if it suggests a blocked request or other issue
    document.body.textContent = 'Application integrity check failed due to an error.';
    window.location.href = 'about:blank';
  }
};

export default verifyIntegrity;