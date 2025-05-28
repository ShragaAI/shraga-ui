import React from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";

import App from "./App.tsx";
import AuthProvider from "./contexts/AuthContext.tsx";
import ThemeProvider from "./contexts/ThemeContext.tsx";

export interface CreateRootConfig {
  logo?: React.ComponentType<{ className?: string }>;
}

export const createRoot = (element: HTMLElement, chatCls?: React.FC, config?: CreateRootConfig) => {
    return ReactDOM.createRoot(element).render(
      <React.StrictMode>
        <ThemeProvider>
          <AuthProvider>
            <App customChatComponent={chatCls} config={config} />
          </AuthProvider>
        </ThemeProvider>
        <ToastContainer aria-label={"toast-messages"} />
      </React.StrictMode>
    );
}