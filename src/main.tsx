import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ConversationsProvider } from "./contexts/ConversationsContext.tsx";
import { UserProvider } from "./contexts/UserContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="app-zoom-shell">
      <UserProvider>
        <ConversationsProvider>
          <App />
        </ConversationsProvider>
      </UserProvider>
    </div>
  </StrictMode>,
);
