import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { 
  LayoutDashboard, 
  Settings, 
  Flag, 
  Users, 
  ClipboardList,
  FileText,
  Bell,
  FileSpreadsheet,
  MessageSquare,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const Sidebar = () => {
  const user = useAuthStore((state) => state.user);
  const sidebarOpen = useAuthStore((state) => state.sidebarOpen);
  const isAdmin = user?.role_name === 'Admin';
  const [openSubmenu, setOpenSubmenu] = useState<string | null>('master');

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      show: true,
    },
    {
      title: 'Master Data',
      icon: Settings,
      path: '/master',
      show: isAdmin,
      submenu: [
        { title: 'Priorities', path: '/master/priorities' },
        { title: 'Project Status', path: '/master/project-status' },
        { title: 'Roles', path: '/master/roles' },
        { title: 'Task Status', path: '/master/task-status' },
      ],
    },
    {
      title: 'Projects',
      icon: Flag,
      path: '/projects',
      show: true,
    },
    {
      title: 'Tasks',
      icon: ClipboardList,
      path: '/tasks',
      show: true,
    },
    {
      title: 'Documents',
      icon: FileText,
      path: '/documents',
      show: true,
    },
    // {
    //   title: 'Meetings',
    //   icon: Calendar,
    //   path: '/meetings',
    //   show: true,
    // },
    {
      title: 'Reports',
      icon: FileSpreadsheet,
      path: '/reports',
      show: true,
    },
    {
      title: 'Meeting Minutes',
      icon: MessageSquare,
      path: '/meeting-minutes',
      show: true,
    },
    {
      title: 'Notifications',
      icon: Bell,
      path: '/notification',
      show: true,
    },
    {
      title: 'Users',
      icon: Users,
      path: '/users',
      show: isAdmin,
    },
  ];

  return (
    <div className={twMerge(
      "fixed top-0 left-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 overflow-hidden",
      sidebarOpen ? "w-64" : "w-0"
    )}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-16 border-b border-gray-200 bg-indigo-50">
          <h1 className="text-xl font-bold text-indigo-600 truncate px-4">{user?.role_name}</h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {menuItems
            .filter((item) => item.show)
            .map((item) => (
              <div key={item.path}>
                {item.submenu ? (
                  <button
                    onClick={() => setOpenSubmenu(openSubmenu === item.path ? null : item.path)}
                    className={twMerge(
                      "flex items-center justify-between w-full px-4 py-2.5 mt-2 text-gray-600 rounded-lg hover:bg-gray-100",
                      openSubmenu === item.path && "bg-indigo-50 text-indigo-600"
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.title}</span>
                    </div>
                    {openSubmenu === item.path ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      twMerge(
                        "flex items-center px-4 py-2.5 mt-2 text-gray-600 rounded-lg hover:bg-gray-100",
                        isActive && "bg-indigo-50 text-indigo-600"
                      )
                    }
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.title}</span>
                  </NavLink>
                )}
                {item.submenu && openSubmenu === item.path && (
                  <div className="ml-8 mt-2 space-y-1">
                    {item.submenu.map((subItem) => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        className={({ isActive }) =>
                          twMerge(
                            "flex items-center px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100",
                            isActive && "bg-indigo-50 text-indigo-600"
                          )
                        }
                      >
                        {subItem.title}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;