import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n/config"; // Initialize i18n
import App from "./App";
import { RTLProvider } from "./lib/rtl";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(
  <React.StrictMode>
    <RTLProvider>
      <App />
    </RTLProvider>
  </React.StrictMode>,
);
