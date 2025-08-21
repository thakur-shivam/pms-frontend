import { useNavigate } from 'react-router-dom';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import Button from './ui/Button';

const Header = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const sidebarOpen = useAuthStore((state) => state.sidebarOpen);
  const toggleSidebar = useAuthStore((state) => state.toggleSidebar);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className={`bg-white border-b border-gray-200 fixed top-0 right-0 z-30 transition-all duration-300 ${sidebarOpen ? 'left-64' : 'left-0'}`}>
      <div className="px-8 h-16 flex items-center">
        <button
          className="p-2 hover:bg-gray-100 rounded-md mr-4"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1 className="text-xl font-semibold text-gray-800 flex-1">Project Management System</h1>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role_name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-600 hover:text-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;