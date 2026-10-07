import { Navigate, Route, Routes, Outlet, useLocation } from "react-router";
import { lazy, Suspense } from "react";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { OverviewPage } from "./pages/OverviewPage";
import { UsersPage } from "./pages/UsersPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { ProductCategoriesPage } from "./pages/ProductCategoriesPage";
import { CatalogPage } from "./pages/CatalogPage";
import { OrdersPage } from "./pages/OrdersPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { OrderEditorPage } from "./pages/OrderEditorPage";
import { TablesPage } from "./pages/TablesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useAuthStore } from "./store/useAuthStore";
import {
  canManageProductCategories,
  canManageUsers,
  canOperateOrders,
} from "./lib/user-display";

const ReportsPage = lazy(() =>
  import("./pages/ReportsPage").then((module) => ({ default: module.ReportsPage })),
);

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
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route
              path="reports"
              element={
                <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-line-soft" />}>
                  <ReportsPage />
                </Suspense>
              }
            />
          </Route>
          <Route element={<GlobalManagerOnlyRoute />}>
            <Route path="product-categories" element={<ProductCategoriesPage />} />
          </Route>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="tables" element={<TablesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route element={<OrderOperatorRoute />}>
            <Route path="orders/new" element={<OrderEditorPage />} />
            <Route path="orders/:id/edit" element={<OrderEditorPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function OrderOperatorRoute() {
  const user = useAuthStore((state) => state.user);
  return user && canOperateOrders(user.role)
    ? <Outlet />
    : <Navigate to="/orders" replace />;
}

function ManagerOnlyRoute() {
  const user = useAuthStore((state) => state.user);
  return user && canManageUsers(user.role) ? <Outlet /> : <Navigate to="/" replace />;
}

function GlobalManagerOnlyRoute() {
  const user = useAuthStore((state) => state.user);
  return user && canManageProductCategories(user.role)
    ? <Outlet />
    : <Navigate to="/" replace />;
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
