import { Navigate, Route, Routes, Outlet, useLocation } from "react-router";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { OverviewPage } from "./pages/OverviewPage";
import { UsersPage } from "./pages/UsersPage";
import { BranchesPage } from "./pages/BranchesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { useAuthStore } from "./store/useAuthStore";
import { canManageUsers } from "./lib/user-display";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<OverviewPage />} />
          <Route element={<ManagerOnlyRoute />}>
            <Route path="users" element={<UsersPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
          </Route>
          <Route path="branches" element={<BranchesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ManagerOnlyRoute() {
  const user = useAuthStore((state) => state.user);
  return user && canManageUsers(user.role) ? <Outlet /> : <Navigate to="/" replace />;
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
