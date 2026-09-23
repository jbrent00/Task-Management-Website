import { Routes, Route, Navigate } from 'react-router-dom';
import { Show } from '@clerk/react';
import './App.css'
import TasksPage from './pages/tasks-page';
import SignInPage from './pages/sign-in-page';
import SignUpPage from './pages/sign-up-page';
import ProjectsPage from './pages/projects-page';
import ProjectPage from './pages/project-page';
import AppShell from './components/app-shell/app-shell';

const ProtectedPage = ({ children }) => <>
  <Show when="signed-in"><AppShell>{children}</AppShell></Show>
  <Show when="signed-out"><Navigate to="/sign-in" /></Show>
</>;

function App() {
  return (    
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
  );
}

export default App;
