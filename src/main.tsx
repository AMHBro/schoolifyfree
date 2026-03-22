import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "antd/dist/reset.css";
import { Toaster } from "react-hot-toast";
import "./i18n/config";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "#363636",
          color: "#fff",
        },
        success: {
          style: {
            background: "#52c41a",
          },
        },
        error: {
          style: {
            background: "#ff4d4f",
          },
        },
      }}
    />
  </React.StrictMode>
);
