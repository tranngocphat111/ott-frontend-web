import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import { routes, ROUTE_PATHS } from "./routers";
import CallPage from "./pages/CallPage";
import "./App.css";

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const adminRoutes = routes.filter((route) =>
    route.path?.startsWith("/admin"),
  );
  const appRoutes = routes.filter((route) => !route.path?.startsWith("/admin"));

  if (isAdminRoute) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-white">
        <Routes>
          {adminRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          <Route
            path="*"
            element={<Navigate to={ROUTE_PATHS.ADMIN} replace />}
          />
        </Routes>
      </div>
    );
  }

  if (location.pathname === ROUTE_PATHS.CALL) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-slate-950">
        <Routes>
          <Route path={ROUTE_PATHS.CALL} element={<CallPage />} />
          <Route
            path="*"
            element={<Navigate to={ROUTE_PATHS.CALL} replace />}
          />
        </Routes>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-white">
      {/* {isAuthenticated ? ( */}
      <MainLayout>
        <Routes>
          <Route
            path="/"
            element={<Navigate to={ROUTE_PATHS.CHAT} replace />}
          />
          {appRoutes.map((route) => (
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
