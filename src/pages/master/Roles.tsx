import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Button from '../../components/ui/Button';
import { Table, TableColumn } from '../../components/ui/Table';
import { Role } from '../../types/role';

const MasterRoles = () => {
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const queryClient = useQueryClient();

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles/select');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post('/roles/create', { roleName: name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setNewRoleName('');
      toast.success('Role created successfully');
    },
    onError: () => toast.error('Failed to create role'),
  });

  const updateMutation = useMutation({
    mutationFn: (role: Role) => 
      api.put(`/roles/update/${role.id}`, { roleName: role.role_name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setEditingRole(null);
      toast.success('Role updated successfully');
    },
    onError: () => toast.error('Failed to update role'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/delete/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
    },
    onError: () => toast.error('Failed to delete role'),
  });

  const columns = [
    {
      header: 'Name',
      accessor: 'role_name',
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (role: Role) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingRole(role)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteMutation.mutate(role.id)}
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
        <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="New role name"
            className="px-4 py-2 border rounded-md"
          />
          <Button
            onClick={() => createMutation.mutate(newRoleName)}
            disabled={!newRoleName.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Role
          </Button>
        </div>
      </div>

      <Table
        data={roles || []}
        columns={columns as TableColumn<Role>[]}
        itemsPerPage={5}
      />

      {/* Edit Modal */}
      {editingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Role</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingRole(null)}
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
                  value={editingRole.role_name}
                  onChange={(e) =>
                    setEditingRole({
                      ...editingRole,
                      role_name: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setEditingRole(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => updateMutation.mutate(editingRole)}
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

export default MasterRoles;