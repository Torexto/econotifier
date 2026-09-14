import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
   window.addEventListener("load", () => {
      void navigator.serviceWorker.register("/sw.js");
   });
}

// biome-ignore lint/style/noNonNullAssertion: React root element is guaranteed to exist
createRoot(document.getElementById("root")!).render(
   <StrictMode>
      <App />
   </StrictMode>,
);
