import React from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";

import App from "./App.tsx";
import AuthProvider from "./contexts/AuthContext.tsx";
import ThemeProvider from "./contexts/ThemeContext.tsx";
import ChatProvider from "./contexts/ChatContext.tsx";

export const createRoot = (element: HTMLElement, chatCls?: React.FC) => {
    return ReactDOM.createRoot(element).render(
      <React.StrictMode>
        <ThemeProvider>
          <AuthProvider>
            <ChatProvider customChatComponent={chatCls}>
              <App />
            </ChatProvider>
          </AuthProvider>
        </ThemeProvider>
        <ToastContainer aria-label={"toast-messages"} />
      </React.StrictMode>
    );
}