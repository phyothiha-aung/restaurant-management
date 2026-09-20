import { Navigate, Route, Routes, Outlet, useLocation } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { useAuthStore } from "./store/useAuthStore";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

function PublicOnlyRoute() {
  const token = useAuthStore((state) => state.token);

  return token ? <Navigate to="/" replace /> : <Outlet />;
}
