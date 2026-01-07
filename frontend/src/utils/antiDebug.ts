import { secureLogger } from "./secureLogger";

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
      if (after - before > 100) {
        // If time difference is significant, debugger was likely hit
        // You can add more aggressive actions here, e.g., redirect or clear local storage
        // Use safer text content instead of innerHTML
        document.body.textContent = "Debugger detected!";
        window.location.href = "about:blank"; // Redirect to a blank page
      }
    } catch (error) {
      secureLogger.error("SECURITY", "Anti-debug check error", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Schedule the next check
    setTimeout(check, 2000);
  };

  // Start the checks
  check();
};

export default antiDebug;
