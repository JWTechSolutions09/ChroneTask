import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Access from "./pages/Access";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Orgs from "./pages/Orgs";
import OrgSelect from "./pages/OrgSelect";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Board from "./pages/Board";
import CreateTaskPage from "./pages/CreateTaskPage";
import CreateNotePage from "./pages/CreateNotePage";
import CreateEventPage from "./pages/CreateEventPage";
import ProjectCommentsPage from "./pages/ProjectCommentsPage";
import InvitationsPage from "./pages/InvitationsPage";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Analytics from "./pages/Analytics";
import Timeline from "./pages/Timeline";
import Notes from "./pages/Notes";
import Calendar from "./pages/Calendar";
import { isAuthed } from "./auth/token";
import { setNavigateFunction } from "./api/http";
import { useUserUsageType } from "./hooks/useUserUsageType";
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
    const { usageType, loading: loadingUsageType } = useUserUsageType();

    React.useEffect(() => {
        // Verificar autenticación de forma asíncrona para evitar problemas de render
        const checkAuth = () => {
            const auth = isAuthed();
            setIsAuthenticated(auth);
            setIsChecking(false);
        };
        checkAuth();
    }, []);

    if (isChecking || loadingUsageType) {
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

    if (!isAuthenticated) {
        return children;
    }

    // Redirigir según el tipo de uso
    switch (usageType) {
        case "personal":
            return <Navigate to="/personal/projects" replace />;
        case "team":
            return <Navigate to="/teams" replace />;
        case "business":
        default:
            return <Navigate to="/org-select" replace />;
    }
}

function DefaultRedirect() {
    const { usageType, loading } = useUserUsageType();
    const authenticated = isAuthed();

    if (loading) {
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

    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    // Redirigir según el tipo de uso
    switch (usageType) {
        case "personal":
            return <Navigate to="/personal/projects" replace />;
        case "team":
            return <Navigate to="/teams" replace />;
        case "business":
        default:
            return <Navigate to="/org-select" replace />;
    }
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
                path="/access"
                element={<Access />}
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
                path="/onboarding"
                element={
                    <PrivateRoute>
                        <Onboarding />
                    </PrivateRoute>
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
                path="/teams"
                element={
                    <PrivateRoute>
                        <Orgs />
                    </PrivateRoute>
                }
            />
            <Route
                path="/teams/notifications"
                element={
                    <PrivateRoute>
                        <Notifications />
                    </PrivateRoute>
                }
            />
            <Route
                path="/personal/dashboard"
                element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                }
            />
            <Route
                path="/personal/projects"
                element={
                    <PrivateRoute>
                        <Projects />
                    </PrivateRoute>
                }
            />
            <Route
                path="/personal/project/:projectId/board"
                element={
                    <PrivateRoute>
                        <Board />
                    </PrivateRoute>
                }
            />
            <Route
                path="/personal/project/:projectId/create-task"
                element={
                    <PrivateRoute>
                        <CreateTaskPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/personal/project/:projectId/timeline"
                element={
                    <PrivateRoute>
                        <Timeline />
                    </PrivateRoute>
                }
            />
            <Route
                path="/personal/project/:projectId/notes"
                element={
                    <PrivateRoute>
                        <Notes />
                    </PrivateRoute>
                }
            />
            <Route
                path="/personal/project/:projectId/comments"
                element={
                    <PrivateRoute>
                        <ProjectCommentsPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/personal/timeline"
                element={
                    <PrivateRoute>
                        <Timeline />
                    </PrivateRoute>
                }
            />
            <Route
                path="/personal/notes"
                element={
                    <PrivateRoute>
                        <Notes />
                    </PrivateRoute>
                }
            />
            <Route
                path="/personal/create-note"
                element={
                    <PrivateRoute>
                        <CreateNotePage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/personal/notifications"
                element={
                    <PrivateRoute>
                        <Notifications />
                    </PrivateRoute>
                }
            />
            <Route
                path="/personal/calendar"
                element={
                    <PrivateRoute>
                        <Calendar />
                    </PrivateRoute>
                }
            />
            <Route
                path="/personal/create-event"
                element={
                    <PrivateRoute>
                        <CreateEventPage />
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
                path="/org/:organizationId/project/:projectId/create-task"
                element={
                    <PrivateRoute>
                        <CreateTaskPage />
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
                path="/org/:organizationId/project/:projectId/comments"
                element={
                    <PrivateRoute>
                        <ProjectCommentsPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/org/:organizationId/invitations"
                element={
                    <PrivateRoute>
                        <InvitationsPage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/org/:organizationId/project/:projectId/create-note"
                element={
                    <PrivateRoute>
                        <CreateNotePage />
                    </PrivateRoute>
                }
            />
            <Route
                path="/org/:organizationId/notes"
                element={
                    <PrivateRoute>
                        <Notes />
                    </PrivateRoute>
                }
            />
            <Route
                path="/org/:organizationId/create-note"
                element={
                    <PrivateRoute>
                        <CreateNotePage />
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
                element={<DefaultRedirect />}
            />
        </Routes>
    );
}

export default function App() {
    return <AppContent />;
}
