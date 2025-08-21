import { useState } from 'react';
import { CheckCircle, Clock, Users, BarChart } from 'lucide-react';

function Dashboard() {
  const [tasks] = useState([
    { id: 1, title: 'Design Review', status: 'completed' },
    { id: 2, title: 'Frontend Development', status: 'in-progress' },
    { id: 3, title: 'Backend Integration', status: 'pending' }
  ]);

  const [projects] = useState([
    { id: 1, name: 'Website Redesign', progress: 75 },
    { id: 2, name: 'Mobile App', progress: 45 },
    { id: 3, name: 'API Development', progress: 90 }
  ]);

  const [activities] = useState([
    { id: 1, user: 'Sarah', action: 'completed a task', time: '2m ago' },
    { id: 2, user: 'Mike', action: 'created a new project', time: '1h ago' },
    { id: 3, user: 'Anna', action: 'updated documentation', time: '3h ago' }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Welcome back!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tasks Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
            <CheckCircle className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between">
                <span className="text-gray-600">{task.title}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                  }`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Projects Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
            <BarChart className="h-5 w-5 text-purple-500" />
          </div>
          <div className="space-y-4">
            {projects.map(project => (
              <div key={project.id} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">{project.name}</span>
                  <span className="text-sm text-gray-500">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Activity Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Team Activity</h2>
            <Users className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">{activity.user[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">{activity.user}</span>
                    {' '}{activity.action}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Total Tasks</p>
              <p className="text-2xl font-bold text-blue-700">{tasks.length}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Active Projects</p>
              <p className="text-2xl font-bold text-purple-700">{projects.length}</p>
            </div>
            <BarChart className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Team Members</p>
              <p className="text-2xl font-bold text-green-700">12</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Completed Tasks</p>
              <p className="text-2xl font-bold text-yellow-700">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;