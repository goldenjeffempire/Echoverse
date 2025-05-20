import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@/components/ui/theme-provider";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container not found");
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="echoverse-ui-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
