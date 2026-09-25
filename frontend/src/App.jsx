import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Show } from '@clerk/react';
import './App.css'
import AppShell from './components/app-shell/app-shell';
import { Skeleton } from './components/ui/ui';

const TasksPage = lazy(() => import('./pages/tasks-page'));
const SignInPage = lazy(() => import('./pages/sign-in-page'));
const SignUpPage = lazy(() => import('./pages/sign-up-page'));
const ProjectsPage = lazy(() => import('./pages/projects-page'));
const ProjectPage = lazy(() => import('./pages/project-page'));

export const ProtectedPage = ({ children }) => <>
  <Show when="signed-in"><AppShell>{children}</AppShell></Show>
  <Show when="signed-out"><Navigate to="/sign-in" /></Show>
</>;

function RouteFallback() {
  return <div className="route-fallback" role="status" aria-label="Loading page"><Skeleton /><Skeleton /><Skeleton /></div>;
}

function App() {
  return (    
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route
          path="/tasks"
          element={<ProtectedPage><TasksPage /></ProtectedPage>}
        />
        <Route path="/projects" element={<ProtectedPage><ProjectsPage /></ProtectedPage>} />
        <Route path="/projects/:projectId" element={<ProtectedPage><ProjectPage /></ProtectedPage>} />
        <Route path="/" element={<Navigate to="/tasks" />} />
      </Routes>
    </Suspense>
  );
}

export default App;
