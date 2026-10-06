import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router";
import { ToastContainer } from "react-toastify";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import App from "./App.tsx";
import { AppConfigProvider } from "./features/app-config/AppConfigProvider.tsx";

const queryClient = new QueryClient();
const router = createBrowserRouter([{ path: "*", element: <App /> }]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppConfigProvider>
        <RouterProvider router={router} />
      </AppConfigProvider>
      <ToastContainer position="top-right" autoClose={4000} />
    </QueryClientProvider>
  </StrictMode>,
);
