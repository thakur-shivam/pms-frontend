import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, Users, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../api/axios';
import Button from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Task, TaskAssignee, TaskAssignment } from '../types/task';
import { User } from '../types/auth';

const Tasks = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [isAssignmentsViewOpen, setIsAssignmentsViewOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskAssignees, setSelectedTaskAssignees] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    project_id: '',
    status_id: '',
    priority_id: '',
    due_date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);
  const [assignTaskData, setAssignTaskData] = useState({
    task_id: '',
    user_id: '',
  });

  const queryClient = useQueryClient();

  // Fetch all required data
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks/select');
      return response.data.data;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects/select');
      return response.data.data;
    },
  });

  const { data: statuses } = useQuery({
    queryKey: ['taskStatuses'],
    queryFn: async () => {
      const response = await api.get('/task-statuses/select');
      return response.data.data;
    },
  });

  const { data: priorities } = useQuery({
    queryKey: ['priorities'],
    queryFn: async () => {
      const response = await api.get('/priorities/select');
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

  const { data: taskAssignees } = useQuery({
    queryKey: ['taskAssignees', selectedTask?.id],
    queryFn: async () => {
      if (!selectedTask) return [];
      const response = await api.get('/task-assignees/select');
      return response.data.taskAssignees.filter(
        (assignee: TaskAssignee) => assignee.task_id === selectedTask.id
      );
    },
    enabled: !!selectedTask,
  });

  // Update task assignments query to match database structure
  const { data: taskAssignments } = useQuery({
    queryKey: ['taskAssignments'],
    queryFn: async () => {
      const response = await api.get('/task-assignees/select');
      return response.data.data;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: Omit<Task, 'id'>) => {
      const response = await api.post('/tasks/create', data).catch((error) => {
        throw error.response; // Throw response so we can catch errors
      });
      return response;
    },
    onSuccess: (response) => {
      if (response.status === 201) {  // Success case
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        setIsModalOpen(false);
        resetForm();
        toast.success('Task created successfully');
      } else {
        // Handle all errors inside the else block
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
    mutationFn: (data: Task) => api.put(`/tasks/update/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsModalOpen(false);
      setSelectedTask(null);
      resetForm();
      toast.success('Task updated successfully');
    },
    onError: () => toast.error('Failed to update task'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/delete/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted successfully');
    },
    onError: () => toast.error('Failed to delete task'),
  });

  const updateAssigneesMutation = useMutation({
    mutationFn: async ({ taskId, userIds }: { taskId: string; userIds: string[] }) => {
      // First, delete all existing assignees
      const currentAssignees = taskAssignees || [];
      await Promise.all(
        currentAssignees.map((assignee: TaskAssignee) =>
          api.delete(`/task-assignees/delete/${assignee.id}`)
        )
      );

      // Then create new assignees
      return Promise.all(
        userIds.map((user_id) =>
          api.post('/task-assignees/create', { task_id: taskId, user_id: user_id })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskAssignees'] });
      setIsAssigneeModalOpen(false);
      toast.success('Task assignees updated successfully');
    },
    onError: () => toast.error('Failed to update task assignees'),
  });

  // Add mutation for creating task assignment
  const createAssignmentMutation = useMutation({
    mutationFn: (data: { task_id: string; user_id: string }) => {
      return api.post('/task-assignees/create', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskAssignments'] });
      setIsAssignTaskModalOpen(false);
      setAssignTaskData({ task_id: '', user_id: '' });
      toast.success('Task assigned successfully');
    },
    onError: () => toast.error('Failed to assign task'),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      project_id: '',
      status_id: '',
      priority_id: '',
      due_date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      project_id: formData.project_id,
      status_id: formData.status_id,
      priority_id: formData.priority_id,
      due_date: formData.due_date,
    };

    if (selectedTask) {
      updateMutation.mutate({ ...data, id: selectedTask.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      name: task.name,
      project_id: task.project_id,
      status_id: task.status_id,
      priority_id: task.priority_id,
      due_date: format(task.due_date, 'yyyy-MM-dd'),
    });
    setIsModalOpen(true);
  };

  const handleAssignees = (task: Task) => {
    setSelectedTask(task);
    const currentAssignees = taskAssignees || [];
    setSelectedTaskAssignees(
      currentAssignees.map((assignee: TaskAssignee) => assignee.user_id)
    );
    setIsAssigneeModalOpen(true);
  };

  const handleDeleteAssignment = (id: string) => {
    if (window.confirm('Are you sure you want to remove this task assignment?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    createAssignmentMutation.mutate({
      task_id: assignTaskData.task_id,
      user_id: assignTaskData.user_id,
    });
  };

  const columns = [
    {
      header: 'Name',
      accessor: (task: Task) => task.name,
      sortable: true,
    },
    {
      header: 'Project',
      accessor: (task: Task) => {
        const project = projects?.find((p: any) => p.id === task.project_id);
        return project ? project.name : 'Unknown Project';
      },
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (task: Task) => {
        const status = statuses?.find((s: any) => s.id === task.status_id);
        return status ? status.status_name : 'Unknown Status';
      },
      sortable: true,
    },
    {
      header: 'Priority',
      accessor: (task: Task) => {
        const priority = priorities?.find((p: any) => p.id === task.priority_id);
        return priority ? priority.priority_name : 'Unknown Priority';
      },
      sortable: true,
    },
    {
      header: 'Due Date',
      accessor: (task: Task) => format(new Date(task.due_date), 'MMM d, yyyy'),
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (task: Task) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAssignees(task)}
          >
            <Users className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(task)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteMutation.mutate(task.id)}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  // Update assignment columns to match database structure
  const assignmentColumns = [
    {
      header: 'Task',
      accessor: (assignment: TaskAssignment) => {
        const task = tasks?.find((t: Task) => t.id === assignment.task_id);
        return task ? task.name : 'Unknown Task';
      },
      sortable: true,
    },
    {
      header: 'Assigned To',
      accessor: (assignment: TaskAssignment) => {
        const user = users?.find((u: User) => u.id === assignment.user_id);
        return user ? user.name : 'Unknown User';
      },
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (assignment: TaskAssignment) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteAssignment(assignment.id)}
            title="Remove Assignment"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsAssignmentsViewOpen(!isAssignmentsViewOpen)}
          >
            <List className="w-4 h-4 mr-2" />
            {isAssignmentsViewOpen ? 'View Tasks' : 'View Assignments'}
          </Button>
          {!isAssignmentsViewOpen && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          )}
          {isAssignmentsViewOpen && (
            <Button onClick={() => setIsAssignTaskModalOpen(true)}>
              <Users className="w-4 h-4 mr-2" />
              Assign Task
            </Button>
          )}
        </div>
      </div>

      {isAssignmentsViewOpen ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Task Assignments</h2>
          <Table<TaskAssignment>
            data={taskAssignments || []}
            columns={assignmentColumns}
            itemsPerPage={10}
          />
        </div>
      ) : (
        <Table
          data={tasks || []}
          columns={columns}
          itemsPerPage={10}
        />
      )}

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedTask ? 'Edit Task' : 'Add New Task'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedTask(null);
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Project
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                  required
                >
                  <option value="">Select Project</option>
                  {projects?.map((project: any) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={formData.status_id}
                  onChange={(e) => setFormData({ ...formData, status_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
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
                  Priority
                </label>
                <select
                  value={formData.priority_id}
                  onChange={(e) => setFormData({ ...formData, priority_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                  required
                >
                  <option value="">Select Priority</option>
                  {priorities?.map((priority: any) => (
                    <option key={priority.id} value={priority.id}>
                      {priority.priority_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedTask(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedTask ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignees Modal */}
      {isAssigneeModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manage Assignees</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAssigneeModalOpen(false);
                  setSelectedTask(null);
                  setSelectedTaskAssignees([]);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="max-h-[400px] overflow-y-auto pr-2">
              <div className="space-y-2">
                {users?.map((user: User) => (
                  <label key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedTaskAssignees.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTaskAssignees([...selectedTaskAssignees, user.id]);
                        } else {
                          setSelectedTaskAssignees(
                            selectedTaskAssignees.filter((id) => id !== user.id)
                          );
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-gray-900">{user.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsAssigneeModalOpen(false);
                  setSelectedTask(null);
                  setSelectedTaskAssignees([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  updateAssigneesMutation.mutate({
                    taskId: selectedTask.id,
                    userIds: selectedTaskAssignees,
                  })
                }
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {isAssignTaskModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Assign Task</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAssignTaskModalOpen(false);
                  setAssignTaskData({ task_id: '', user_id: '' });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Task
                </label>
                <select
                  value={assignTaskData.task_id}
                  onChange={(e) => setAssignTaskData({ ...assignTaskData, task_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                  required
                >
                  <option value="">Select Task</option>
                  {tasks?.map((task: Task) => (
                    <option key={task.id} value={task.id}>
                      {task.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assign To
                </label>
                <select
                  value={assignTaskData.user_id}
                  onChange={(e) => setAssignTaskData({ ...assignTaskData, user_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                  required
                >
                  <option value="">Select User</option>
                  {users?.map((user: User) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsAssignTaskModalOpen(false);
                    setAssignTaskData({ task_id: '', user_id: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Assign Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;