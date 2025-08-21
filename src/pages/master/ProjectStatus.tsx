import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Button from '../../components/ui/Button';
import { Table, TableColumn } from '../../components/ui/Table';
import { ProjectStatus } from '../../types/projectStatus';

const MasterProjectStatus = () => {
  const [editingStatus, setEditingStatus] = useState<ProjectStatus | null>(null);
  const [newStatusName, setNewStatusName] = useState('');
  const queryClient = useQueryClient();

  const { data: statuses } = useQuery({
    queryKey: ['projectStatuses'],
    queryFn: async () => {
      const response = await api.get('/project-statuses/select');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post('/project-statuses/create', { status_name: name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectStatuses'] });
      setNewStatusName('');
      toast.success('Project status created successfully');
    },
    onError: () => toast.error('Failed to create project status'),
  });

  const updateMutation = useMutation({
    mutationFn: (status: ProjectStatus) => 
      api.put(`/project-statuses/update/${status.id}`, { status_name: status.status_name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectStatuses'] });
      setEditingStatus(null);
      toast.success('Project status updated successfully');
    },
    onError: () => toast.error('Failed to update project status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/project-statuses/delete/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectStatuses'] });
      toast.success('Project status deleted successfully');
    },
    onError: () => toast.error('Failed to delete project status'),
  });

  const columns = [
    {
      header: 'Name',
      accessor: 'status_name',
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (status: ProjectStatus) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingStatus(status)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteMutation.mutate(status.id)}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Project Status</h1>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={newStatusName}
            onChange={(e) => setNewStatusName(e.target.value)}
            placeholder="New status name"
            className="px-4 py-2 border rounded-md"
          />
          <Button
            onClick={() => createMutation.mutate(newStatusName)}
            disabled={!newStatusName.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Status
          </Button>
        </div>
      </div>

      <Table
        data={statuses || []}
        columns={columns as TableColumn<ProjectStatus>[]}
        itemsPerPage={5}
      />

      {/* Edit Modal */}
      {editingStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Status</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingStatus(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={editingStatus.status_name}
                  onChange={(e) =>
                    setEditingStatus({
                      ...editingStatus,
                      status_name: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setEditingStatus(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => updateMutation.mutate(editingStatus)}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterProjectStatus;