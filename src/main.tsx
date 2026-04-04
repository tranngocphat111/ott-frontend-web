import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

import AppRouter from "./routers/AppRouter";
import { AuthProvider } from "./context/AuthContext";
import { ConversationsProvider } from "./contexts/ConversationsContext";
import { UserProvider } from "./contexts/UserContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="app-zoom-shell">
      <BrowserRouter>
        <AuthProvider>
          <UserProvider>
            <ConversationsProvider>
              <AppRouter />
            </ConversationsProvider>
          </UserProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  </StrictMode>
);