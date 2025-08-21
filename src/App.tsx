import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import AuthLayout from './components/AuthLayout';
import GuestLayout from './components/GuestLayout';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

import Users from './pages/Users';
import Tasks from './pages/Tasks';
import Projects from './pages/projects';
import Documents from './pages/documents';
import MeetingMinutes from './pages/meetingMinutes';
import Notification from './pages/notification';
import Reports from './pages/report';

import MasterPriorities from './pages/master/Priorities';
import MasterProjectStatus from './pages/master/ProjectStatus';
import MasterRoles from './pages/master/Roles';
import MasterTaskStatus from './pages/master/TaskStatus';




const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route element={<GuestLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>
            <Route element={<AuthLayout />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/master/priorities" element={<MasterPriorities />} />
                <Route path="/master/project-status" element={<MasterProjectStatus />} />
                <Route path="/master/roles" element={<MasterRoles />} />
                <Route path="/master/task-status" element={<MasterTaskStatus />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/documents" element={<Documents />} />
                
                <Route path="/reports" element={<Reports />} />
                <Route path="/meeting-minutes" element={<MeetingMinutes />} />
                <Route path="/notification" element={<Notification />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;