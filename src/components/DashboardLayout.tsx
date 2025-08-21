import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '../store/auth';

const DashboardLayout = () => {
  const sidebarOpen = useAuthStore((state) => state.sidebarOpen);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-0'}`}>
        <Header />
        <main className="pt-24 px-8 pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;