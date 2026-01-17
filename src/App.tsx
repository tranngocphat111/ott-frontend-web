import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { routes, ROUTE_PATHS } from './routers';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="h-screen w-screen overflow-hidden bg-white">
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to={ROUTE_PATHS.CHAT} replace />} />
            {routes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          </Routes>
        </MainLayout>
      </div>
    </BrowserRouter>
  );
}

export default App;
