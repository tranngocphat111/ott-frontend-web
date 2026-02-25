import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import { routes, ROUTE_PATHS } from "./routers";
import { useUser } from "./contexts/UserContext";
import "./App.css";

function AppContent() {
  const { isAuthenticated } = useUser();

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      {/* {isAuthenticated ? ( */}
      <MainLayout>
        <Routes>
          <Route
            path="/"
            element={<Navigate to={ROUTE_PATHS.CHAT} replace />}
          />
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          <Route
            path="*"
            element={<Navigate to={ROUTE_PATHS.CHAT} replace />}
          />
        </Routes>
      </MainLayout>
      {/* ) : (
        <Routes>
          <Route
            path={ROUTE_PATHS.SELECT_USER}
            element={
              routes.find((r) => r.path === ROUTE_PATHS.SELECT_USER)?.element
            }
          />
          <Route
            path="*"
            element={<Navigate to={ROUTE_PATHS.SELECT_USER} replace />}
          />
        </Routes>
      )} */}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
