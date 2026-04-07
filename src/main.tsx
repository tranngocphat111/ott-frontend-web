import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

import AppRouter from "./routers/AppRouter";
import { AuthProvider } from "./contexts/AuthContext";
import { ConversationsProvider } from "./contexts/ConversationsContext";
import { UserProvider } from "./contexts/UserContext";
import { ToastProvider } from './contexts/ToastContext';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="app-zoom-shell">
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <UserProvider>
              <ConversationsProvider>
                <AppRouter />
              </ConversationsProvider>
            </UserProvider>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </div>
  </StrictMode>
);