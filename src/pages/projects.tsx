import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../api/axios';
import Button from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Task, TaskAssignee } from '../types/task';
import { Project } from '../types/project';
import { User} from '../types/auth'

const Projects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    status_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const queryClient = useQueryClient();

  // Fetch all required data
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects/select');
      return response.data.data;
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks/select');
      return response.data.data;
    },
  });

  const { data: taskAssignees } = useQuery({
    queryKey: ['taskAssignees'],
    queryFn: async () => {
      const response = await api.get('/task-assignees/select');
      return response.data.data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users/select');
      return response.data.data;
    },
  });

  const { data: statuses } = useQuery({
    queryKey: ['projectStatuses'],
    queryFn: async () => {
      const response = await api.get('/project-statuses/select');
      return response.data.data;
    },
  });

  // Get project details including assigned users through tasks
  const getProjectDetails = (project: Project) => {
    // Get all tasks for this project
    const projectTasks = tasks?.filter((task: Task) => task.project_id === project.id) || [];
    
    // Get all users assigned to tasks in this project
    const assignedUserIds = new Set();
    projectTasks.forEach((task: Task) => {
      taskAssignees?.forEach((assignee: TaskAssignee) => {
        if (assignee.task_id === task.id) {
          assignedUserIds.add(assignee.user_id);
        }
      });
    });

    // Get user details
    const assignedUsers = Array.from(assignedUserIds).map(userId => 
      users?.find((user: User) => user.id === userId)
    ).filter(Boolean);

    return {
      taskCount: projectTasks.length,
      assignedUsers: assignedUsers,
      status: statuses?.find((s: any) => s.id === project.status_id)?.status_name
    };
  };

  const columns = [
    {
      header: 'Name',
      accessor: (project: Project) => project.name,
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (project: Project) => getProjectDetails(project).status || '-',
      sortable: true,
    },
    {
      header: 'Assigned Users',
      accessor: (project: Project) => {
        const details = getProjectDetails(project);
        return details.assignedUsers.length > 0 
          ? details.assignedUsers.map((user: any) => user.name).join(', ') 
          : '-';
      },
      sortable: true,
    },
    {
      header: 'Tasks',
      accessor: (project: Project) => getProjectDetails(project).taskCount,
      sortable: true,
    },
    {
      header: 'Timeline',
      accessor: (project: Project) => (
        <span>
          {format(new Date(project.start_date), 'MMM d, yyyy')} - 
          {format(new Date(project.end_date), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (project: Project) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(project)}
          >
            <Users className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(project)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(project.id)}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: Omit<Project, 'id'>) => {
      const response = await api.post('/projects/create', data).catch((error) => {
      throw error.response;
     });
    return response;
  },
      
    onSuccess: ( response) => {
      if ( response.status === 201 ) {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Project created successfully');
    } else {
      if (response.status === 400) {
        toast.error(`Bad Request: ${response.data?.error || "Invalid input data"}`);
      } else if (response.status === 403) {
        toast.error(` ${response.data?.error || "You don't have permission"}`);
      } else if (response.status === 500) {
        toast.error(`Server Error: ${response.data?.error || "Something went wrong"}`);
      } else {
        toast.error(`Error ${response.status}: ${response.data?.error || "An unknown error occurred"}`);
      }
    }
  },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Project) => api.put(`/projects/update/${data.id}`, data),
    onSuccess: ( response) => {
      if ( response.status === 200 ) {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      setSelectedProject(null)
      resetForm();
      toast.success('Project updated successfully');
    } else {
      if (response.status === 400) {
        toast.error(`Bad Request: ${response.data?.error || "Invalid input data"}`);
      } else if (response.status === 403) {
        toast.error(` ${response.data?.error || "You don't have permission"}`);
      } else if (response.status === 500) {
        toast.error(`Server Error: ${response.data?.error || "Something went wrong"}`);
      } else {
        toast.error(`Error ${response.status}: ${response.data?.error || "An unknown error occurred"}`);
      }
    }
  },
    onError: (error) => {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/delete/${id}`),
    onSuccess: ( response) => {
      if ( response.status === 200 ) {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Project deleted successfully');
    } else {
      if (response.status === 400) {
        toast.error(`Bad Request: ${response.data?.error || "Invalid input data"}`);
      } else if (response.status === 403) {
        toast.error(` ${response.data?.error || "You don't have permission"}`);
      } else if (response.status === 500) {
        toast.error(`Server Error: ${response.data?.error || "Something went wrong"}`);
      } else {
        toast.error(`Error ${response.status}: ${response.data?.error || "An unknown error occurred"}`);
      }
    }
  },
    onError: (error) => {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      status_id: '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    
    if (!formData.status_id) {
      toast.error('Please select a status');
      return;
    }
    
    try {
      const data = {
        name: formData.name.trim(),
        status_id: formData.status_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
      };
      
      console.log('Submitting project data:', data);
      
      if (selectedProject) {
        updateMutation.mutate({ ...data, id: selectedProject.id });
      } else {
        createMutation.mutate(data);
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      toast.error('Error in form submission');
    }
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      status_id: project.status_id,
      start_date: format(project.start_date, 'yyyy-MM-dd'),
      end_date: format(project.end_date, 'yyyy-MM-dd'),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setIsAssigneeModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </div>

      <Table
        data={projects || []}
        columns={columns}
        itemsPerPage={10}
      />

      {/* Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedProject ? 'Edit Project' : 'Add New Project'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedProject(null);
                  resetForm();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={formData.status_id}
                  onChange={(e) => setFormData({ ...formData, status_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                  required
                >
                  <option value="">Select Status</option>
                  {statuses?.map((status: any) => (
                    <option key={status.id} value={status.id}>
                      {status.status_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedProject(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedProject ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {isAssigneeModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Project Details: {selectedProject.name}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAssigneeModalOpen(false);
                  setSelectedProject(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Project Status</h3>
                <p>{getProjectDetails(selectedProject).status}</p>
              </div>
              
              <div>
                <h3 className="font-medium">Timeline</h3>
                <p>
                  {format(new Date(selectedProject.start_date), 'MMMM d, yyyy')} - 
                  {format(new Date(selectedProject.end_date), 'MMMM d, yyyy')}
                </p>
              </div>

              <div>
                <h3 className="font-medium">Tasks ({getProjectDetails(selectedProject).taskCount})</h3>
                <div className="mt-2 space-y-2">
                  {tasks?.filter((task: Task) => task.project_id === selectedProject.id)
                    .map((task: Task) => {
                      const assignees = taskAssignees
                        ?.filter((ta: TaskAssignee) => ta.task_id === task.id)
                        .map((ta: TaskAssignee) => users?.find((u: User) => u.id === ta.user_id)?.name)
                        .filter(Boolean);
                      
                      return (
                        <div key={task.id} className="p-2 bg-gray-50 rounded">
                          <div className="font-medium">{task.name}</div>
                          <div className="text-sm text-gray-600">
                            Assigned to: {assignees?.join(', ') || 'No assignees'}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;