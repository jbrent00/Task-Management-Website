import { Routes, Route, Navigate } from 'react-router-dom';
import { Show } from '@clerk/react';
import './App.css'
import TasksPage from './pages/tasks-page';
import SignInPage from './pages/sign-in-page';
import SignUpPage from './pages/sign-up-page';

function App() {
  return (    
      <Routes>
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route
          path="/tasks"
          element={
            <>
              <Show when="signed-in">
                <TasksPage />
              </Show>
              <Show when="signed-out">
                <Navigate to="/sign-in" />
              </Show>
            </>
          }
        />
        <Route path="/" element={<Navigate to="/tasks" />} />
      </Routes>
  );
}

export default App;
