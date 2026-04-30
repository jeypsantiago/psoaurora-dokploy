import React, { Suspense, lazy } from "react";
import { AlertTriangle } from "lucide-react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { ThemeProvider } from "./theme-context";
import type { Permission } from "./types";
import { RouteLoadingShell } from "./components/RouteLoadingShell";

const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })),
);
const EmploymentPage = lazy(() =>
  import("./pages/EmploymentPage").then((module) => ({
    default: module.EmploymentPage,
  })),
);
const GmailHub = lazy(() =>
  import("./pages/GmailHub").then((module) => ({ default: module.GmailHub })),
);
const LandingPage = lazy(() =>
  import("./pages/LandingPage").then((module) => ({
    default: module.LandingPage,
  })),
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({ default: module.LoginPage })),
);
const ResetPasswordPage = lazy(() =>
  import("./pages/ResetPasswordPage").then((module) => ({
    default: module.ResetPasswordPage,
  })),
);
const RegisterPage = lazy(() =>
  import("./pages/RegisterPage").then((module) => ({
    default: module.RegisterPage,
  })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  })),
);
const PropertyPage = lazy(() =>
  import("./pages/PropertyPage").then((module) => ({
    default: module.PropertyPage,
  })),
);
const RecordPage = lazy(() =>
  import("./pages/RecordPage").then((module) => ({
    default: module.RecordPage,
  })),
);
const ReportMonitoringPage = lazy(() =>
  import("./pages/ReportMonitoringPage").then((module) => ({
    default: module.ReportMonitoringPage,
  })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);
const SupplyPage = lazy(() =>
  import("./pages/SupplyPage").then((module) => ({
    default: module.SupplyPage,
  })),
);
const CensusPage = lazy(() =>
  import("./pages/CensusPage").then((module) => ({
    default: module.CensusPage,
  })),
);
const ProtectedShell = lazy(() => import("./components/ProtectedShell"));
const GoogleAuthShell = lazy(() => import("./components/GoogleAuthShell"));
const LandingConfigShell = lazy(() => import("./components/LandingConfigShell"));
const UserShell = lazy(() => import("./components/UserShell"));
const ProtectedRoute = lazy(() =>
  import("./components/ProtectedRoute").then((module) => ({
    default: module.ProtectedRoute,
  })),
);

interface PlaceholderPageProps {
  title: string;
}

interface ProtectedLayoutRouteConfig {
  path: string;
  requires?: Permission;
  element: React.ReactNode;
  requiresGoogleAuth?: boolean;
  requiresLandingConfig?: boolean;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => (
  <div className="py-12 flex flex-col items-center justify-center text-center">
    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full mb-4">
      <AlertTriangle className="h-10 w-10 text-amber-500" />
    </div>
    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
      {title}
    </h2>
    <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
      This module is currently under development. Please check back later for
      updates.
    </p>
  </div>
);

const PROTECTED_LAYOUT_ROUTES: ProtectedLayoutRouteConfig[] = [
  { path: "/dashboard", requires: "dashboard.view", element: <Dashboard /> },
  { path: "/records", requires: "records.view", element: <RecordPage /> },
  { path: "/supplies", requires: "supply.view", element: <SupplyPage /> },
  {
    path: "/employment",
    requires: "employment.view",
    element: <EmploymentPage />,
  },
  {
    path: "/gmail",
    requires: "gmail.view",
    element: <GmailHub />,
    requiresGoogleAuth: true,
  },
  {
    path: "/reports",
    requires: "reports.view",
    element: <ReportMonitoringPage />,
  },
  { path: "/property", requires: "property.view", element: <PropertyPage /> },
  { path: "/census", requires: "census.view", element: <CensusPage /> },
  {
    path: "/office",
    requires: "dashboard.view",
    element: <PlaceholderPage title="Office Information" />,
  },
  { path: "/profile", element: <ProfilePage /> },
  {
    path: "/settings",
    requires: "settings.view",
    element: <SettingsPage />,
    requiresGoogleAuth: true,
    requiresLandingConfig: true,
  },
];

const wrapProtectedRouteElement = (
  route: ProtectedLayoutRouteConfig,
): React.ReactNode => {
  let content = route.element;

  if (route.requiresLandingConfig) {
    content = <LandingConfigShell>{content}</LandingConfigShell>;
  }

  if (route.requiresGoogleAuth) {
    content = <GoogleAuthShell>{content}</GoogleAuthShell>;
  }

  return <ProtectedRoute requires={route.requires}>{content}</ProtectedRoute>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <Suspense fallback={<RouteLoadingShell />}>
          <Routes>
            <Route
              path="/"
              element={
                <LandingConfigShell>
                  <LandingPage />
                </LandingConfigShell>
              }
            />

            <Route element={<UserShell />}>
              <Route
                path="/login"
                element={
                  <LandingConfigShell>
                    <LoginPage />
                  </LandingConfigShell>
                }
              />

              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/register"
                element={
                  <LandingConfigShell>
                    <RegisterPage />
                  </LandingConfigShell>
                }
              />

              <Route element={<ProtectedShell />}>
                {PROTECTED_LAYOUT_ROUTES.map((route) => (
                  <React.Fragment key={route.path}>
                    <Route
                      path={route.path}
                      element={wrapProtectedRouteElement(route)}
                    />
                  </React.Fragment>
                ))}
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
};

export default App;
