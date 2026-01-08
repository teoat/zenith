const antiDebug = () => {
  const check = () => {
    // This will pause execution if dev tools are open
    // and the debugger statement is hit.
    // We wrap it in a try-catch to prevent errors if the debugger is somehow blocked.
    try {
      const before = new Date().getTime();
      // eslint-disable-next-line no-debugger
      debugger;
      const after = new Date().getTime();
      if (after - before > 100) { // If time difference is significant, debugger was likely hit
        // You can add more aggressive actions here, e.g., redirect or clear local storage
        document.body.innerHTML = '<h1>Debugger detected!</h1>';
        window.location.href = 'about:blank'; // Redirect to a blank page
      }
    } catch (err) {
      // console.error("Anti-debug check error:", err);
    }

    // Schedule the next check
    setTimeout(check, 2000);
  };

  // Start the checks
  check();
};

export default antiDebug;