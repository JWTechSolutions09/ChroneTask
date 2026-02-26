import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Orgs from "./pages/Orgs";
import OrgSelect from "./pages/OrgSelect";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Board from "./pages/Board";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Analytics from "./pages/Analytics";
import Timeline from "./pages/Timeline";
import Notes from "./pages/Notes";
import { isAuthed } from "./auth/token";
import { setNavigateFunction } from "./api/http";
import type { ReactElement } from "react";

function PrivateRoute({ children }: { children: ReactElement }) {
    const [isChecking, setIsChecking] = React.useState(true);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);

    React.useEffect(() => {
        // Verificar autenticación de forma asíncrona para evitar problemas de render
        const checkAuth = () => {
            const auth = isAuthed();
            setIsAuthenticated(auth);
            setIsChecking(false);
        };
        checkAuth();
    }, []);

    if (isChecking) {
        return (
            <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                minHeight: "100vh",
                backgroundColor: "#f8f9fa"
            }}>
                <div className="loading">Cargando...</div>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: ReactElement }) {
    const [isChecking, setIsChecking] = React.useState(true);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);

    React.useEffect(() => {
        // Verificar autenticación de forma asíncrona para evitar problemas de render
        const checkAuth = () => {
            const auth = isAuthed();
            setIsAuthenticated(auth);
            setIsChecking(false);
        };
        checkAuth();
    }, []);

    if (isChecking) {
        return (
            <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                minHeight: "100vh",
                backgroundColor: "#f8f9fa"
            }}>
                <div className="loading">Cargando...</div>
            </div>
        );
    }

    return !isAuthenticated ? children : <Navigate to="/org-select" replace />;
}

function AppContent() {
    const navigate = useNavigate();
    
    // Configurar la función de navegación para el interceptor HTTP
    React.useEffect(() => {
        setNavigateFunction((path: string) => navigate(path, { replace: true }));
    }, [navigate]);
    
    return (
        <Routes>
            <Route
                path="/"
                element={<Landing />}
            />
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <Auth />
                    </PublicRoute>
                }
            />
            <Route
                path="/register"
                element={
                    <PublicRoute>
                        <Auth />
                    </PublicRoute>
                }
            />
            <Route
                path="/orgs"
                element={
                    <PrivateRoute>
                        <Orgs />
                    </PrivateRoute>
                }
            />
            <Route
                path="/org-select"
                element={
                    <PrivateRoute>
                        <OrgSelect />
                    </PrivateRoute>
                }
            />
            <Route
                path="/org/:organizationId/dashboard"
                element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                }
            />
            <Route
                path="/org/:organizationId/projects"
                element={
                    <PrivateRoute>
                        <Projects />
                    </PrivateRoute>
                }
            />
            <Route
                path="/org/:organizationId/project/:projectId/board"
                element={
                    <PrivateRoute>
                        <Board />
                    </PrivateRoute>
                }
            />
            <Route
                path="/org/:organizationId/notifications"
                element={
                    <PrivateRoute>
                        <Notifications />
                    </PrivateRoute>
                }
            />
            <Route
                path="/org/:organizationId/analytics"
                element={
                    <PrivateRoute>
                        <Analytics />
                    </PrivateRoute>
                }
            />
            <Route
                path="/org/:organizationId/timeline"
                element={
                    <PrivateRoute>
                        <Timeline />
                    </PrivateRoute>
                }
            />
            <Route
                path="/org/:organizationId/project/:projectId/timeline"
                element={
                    <PrivateRoute>
                        <Timeline />
                    </PrivateRoute>
                }
            />
            <Route
                path="/org/:organizationId/project/:projectId/notes"
                element={
                    <PrivateRoute>
                        <Notes />
                    </PrivateRoute>
                }
            />
            <Route
                path="/settings"
                element={
                    <PrivateRoute>
                        <Settings />
                    </PrivateRoute>
                }
            />
            <Route
                path="*"
                element={
                    <Navigate to={isAuthed() ? "/org-select" : "/login"} replace />
                }
            />
        </Routes>
    );
}

export default function App() {
    return <AppContent />;
}
