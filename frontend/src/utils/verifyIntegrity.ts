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
      console.error('Integrity check failed: index.html has been tampered with!');
      document.body.innerHTML = '<h1>Integrity check failed! The application may have been tampered with.</h1>';
      window.location.href = 'about:blank'; // Redirect to a blank page
    }
  } catch (error) {
    console.error('Error during integrity verification:', error);
    // Potentially take action even on error if it suggests a blocked request or other issue
    document.body.innerHTML = '<h1>Application integrity check failed due to an error.</h1>';
    window.location.href = 'about:blank';
  }
};

export default verifyIntegrity;