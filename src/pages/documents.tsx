import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X, Download, FileIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Button from '../components/ui/Button';
import { Table, TableColumn } from '../components/ui/Table';
import { useAuthStore } from '../store/auth';
import { Document } from '../types/document';
import { Project } from '../types/project';
import { User } from '../types/user';

const Documents = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    project_id: '',
    file_path: null as File | null,
  });
  const [createDocumentData, setCreateDocumentData] = useState({
    name: '',
    project_id: '',
    file_path: '',
  });

  const queryClient = useQueryClient();
  // Get current user from auth
  const user = useAuthStore((state) => state.user);

  // Fetch all required data
  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await api.get('/documents/select');
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

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users/select');
      return response.data.data;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return api.post('/documents/create', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Document uploaded successfully');
    },
    onError: () => toast.error('Failed to upload document'),
  });

  // Direct document creation without file
  const createDocumentMutation = useMutation({
    mutationFn: async (data: { name: string; project_id: string; uploaded_by: string; file_path: string }) => {
      return api.post('/documents/create', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });


      
      setIsCreateModalOpen(false);
      resetCreateForm();
      toast.success('Document created successfully');
    },
    onError: () => toast.error('Failed to create document'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/delete/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted successfully');
    },
    onError: () => toast.error('Failed to delete document'),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      project_id: '',
      file_path: null,
    });
  };

  const resetCreateForm = () => {
    setCreateDocumentData({
      name: '',
      project_id: '',
      file_path: '',
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        file_path: e.target.files[0],
        name: formData.name || e.target.files[0].name,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file_path) {
      toast.error('Please select a file to upload');
      return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('project_id', formData.project_id);
    data.append('file_path', formData.file_path);

    createMutation.mutate(data);
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('You must be logged in to create documents');
      return;
    }

    const data = {
      name: createDocumentData.name,
      project_id: createDocumentData.project_id,
      uploaded_by: user.id,
      file_path: createDocumentData.file_path || `/documents/placeholder-${Date.now()}.txt`,
    };

    createDocumentMutation.mutate(data);
  };

  const handleDownload = (document: Document) => {
    // Create a function to handle the download based on API response
    const downloadFile = async () => {
      try {
        // First, attempt the preferred approach using the download endpoint
        try {
          // Get the file with responseType blob and proper headers
          const response = await api.get(`/documents/download/${document.id}`, {
            responseType: 'blob', // Important for binary data
          });
          
          // Determine the correct MIME type based on file extension
          let contentType = 'application/octet-stream'; // Default binary type
          const fileName = document.name;
          
          if (fileName.endsWith('.pdf')) contentType = 'application/pdf';
          else if (fileName.endsWith('.txt')) contentType = 'text/plain';
          else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) contentType = 'application/msword';
          else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) contentType = 'application/vnd.ms-excel';
          
          // Create a blob with the correct MIME type
          const blob = new Blob([response.data], { type: contentType });
          const url = window.URL.createObjectURL(blob);
          
          // Create an invisible anchor element to trigger download
          const a = window.document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = fileName;
          window.document.body.appendChild(a);
          a.click();
          
          // Clean up
          window.URL.revokeObjectURL(url);
          window.document.body.removeChild(a);
          
          toast.success('Document downloaded successfully');
        } catch (downloadError) {
          // If download endpoint fails, try direct download from file_path
          console.log("Download endpoint failed, trying direct download...");
          
          // Direct access to file via fetch API
          const fileResponse = await fetch(document.file_path);
          if (!fileResponse.ok) throw new Error('Failed to fetch file');
          
          const blob = await fileResponse.blob();
          const url = window.URL.createObjectURL(blob);
          
          const a = window.document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = document.name;
          window.document.body.appendChild(a);
          a.click();
          
          window.URL.revokeObjectURL(url);
          window.document.body.removeChild(a);
          
          toast.success('Document downloaded successfully');
        }
      } catch (error) {
        console.error('All download methods failed:', error);
        toast.error('Failed to download document');
        
        // Last resort - open in new tab
        window.open(document.file_path, '_blank');
      }
    };
    
    downloadFile();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteMutation.mutate(id);
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects?.find((p: Project) => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return 'Unknown User';
    const user = users?.find((u: User) => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
    },
    {
      header: 'Project',
      accessor: (document: Document) => getProjectName(document.project_id),
      sortable: true,
    },
    {
      header: 'Type',
      accessor: (document: Document) => getFileExtension(document.name),
      sortable: true,
    },
    {
      header: 'Uploaded By',
      accessor: (document: Document) => getUserName(document.uploaded_by),
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (document: Document) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(document)}
            title="Download Document"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(document.id)}
            title="Delete Document"
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
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setIsCreateModalOpen(true)}
          >
            <FileIcon className="w-4 h-4 mr-2" />
            Create Document
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      <Table
        data={documents || []}
        columns={columns as TableColumn<Document>[]}
        itemsPerPage={10}
      />

      {/* Document Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upload Document</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Document Name
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
                  {projects?.map((project: Project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  File
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Files are stored on the server at {window.location.origin}/uploads/
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Upload
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Uploaded by: {user?.name || 'Unknown User'}
              </p>
            </form>
          </div>
        </div>
      )}
      
      {/* Create Document Modal (without file upload) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Document</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetCreateForm();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Document Name
                </label>
                <input
                  type="text"
                  value={createDocumentData.name}
                  onChange={(e) => setCreateDocumentData({ ...createDocumentData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Project
                </label>
                <select
                  value={createDocumentData.project_id}
                  onChange={(e) => setCreateDocumentData({ ...createDocumentData, project_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                  required
                >
                  <option value="">Select Project</option>
                  {projects?.map((project: Project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  File Path (Optional)
                </label>
                <input
                  type="text"
                  value={createDocumentData.file_path}
                  onChange={(e) => setCreateDocumentData({ ...createDocumentData, file_path: e.target.value })}
                  placeholder="http://localhost:3307/uploads/filename.txt"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave blank to create a document record without an actual file
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    resetCreateForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create
                </Button>
              </div>
              <div className="border-t pt-3 mt-4 text-xs text-gray-500">
                <p><strong>Note:</strong> Document will be created by: {user?.name || 'Unknown User'}</p>
                <p>This creates a database entry without requiring a file upload.</p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;