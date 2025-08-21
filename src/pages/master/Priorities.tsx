import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Button from '../../components/ui/Button';
import { Table, TableColumn } from '../../components/ui/Table';
import { Priority } from '../../types/priority';

const MasterPriorities = () => {
  const [editingPriority, setEditingPriority] = useState<Priority | null>(null);
  const [newPriorityName, setNewPriorityName] = useState('');
  const queryClient = useQueryClient();

  const { data: priorities } = useQuery({
    queryKey: ['priorities'],
    queryFn: async () => {
      const response = await api.get('/priorities/select');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post('/priorities/create', { priority_name: name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priorities'] });
      setNewPriorityName('');
      toast.success('Priority created successfully');
    },
    onError: () => toast.error('Failed to create priority'),
  });

  const updateMutation = useMutation({
    mutationFn: (priority: Priority) => 
      api.put(`/priorities/update/${priority.id}`, { priority_ame: priority.priority_name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priorities'] });
      setEditingPriority(null);
      toast.success('Priority updated successfully');
    },
    onError: () => toast.error('Failed to update priority'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/priorities/delete/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priorities'] });
      toast.success('Priority deleted successfully');
    },
    onError: () => toast.error('Failed to delete priority'),
  });

  const columns = [
    {
      header: 'Name',
      accessor: 'priority_name',
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (priority: Priority) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingPriority(priority)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteMutation.mutate(priority.id)}
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
        <h1 className="text-2xl font-bold text-gray-900">Priorities</h1>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={newPriorityName}
            onChange={(e) => setNewPriorityName(e.target.value)}
            placeholder="New priority name"
            className="px-4 py-2 border rounded-md"
          />
          <Button
            onClick={() => createMutation.mutate(newPriorityName)}
            disabled={!newPriorityName.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Priority
          </Button>
        </div>
      </div>

      <Table
        data={priorities || []}
        columns={columns as TableColumn<Priority>[]}
        itemsPerPage={5}
      />

      {/* Edit Modal */}
      {editingPriority && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Priority</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingPriority(null)}
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
                  value={editingPriority.priority_name}
                  onChange={(e) =>
                    setEditingPriority({
                      ...editingPriority,
                      priority_name: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setEditingPriority(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => updateMutation.mutate(editingPriority)}
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

export default MasterPriorities;