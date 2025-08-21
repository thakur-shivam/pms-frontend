import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, Users, Calendar, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../api/axios';
import Button from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Meeting } from '../types/meeting';
import { useAuthStore } from '../store/auth';
import { Project } from '../types/project';
import { User } from '../types/auth'

const MeetingMinutes = () => {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [formData, setFormData] = useState({
    project_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    attendees: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  // Fetch all required data
  const { data: meetings, isError: isMeetingsError, error: meetingsError } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      try {
        console.log('Fetching meeting minutes...');
        const response = await api.get('/meeting-minutes/select');
        console.log('Meeting minutes response:', response.data);
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching meeting minutes:', error);
        throw error;
      }
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
    mutationFn: (data: Omit<Meeting, 'id'>) => {
      const transformedData = {
        project_id: data.project_id,
        date: data.date,
        attendees: JSON.stringify(data.attendees),
        notes: data.notes
      };
      console.log('Creating meeting minutes with transformed data:', transformedData);
      return api.post('/meeting-minutes/create', transformedData);
    },
    onSuccess: (response) => {
      if (response.status === 201) {
      console.log('Create meeting minutes success:', response);
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Meeting minutes created successfully');
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
    mutationFn: (data: Meeting) => {
      const transformedData = {
        project_id: data.project_id,
        date: data.date,
        attendees: JSON.stringify(data.attendees),
        notes: data.notes,
      };
      console.log('Updating meeting minutes with ID:', data.id, 'Transformed data:', transformedData);
      return api.put(`/meeting-minutes/update/${data.id}`, transformedData);
    },
    onSuccess: (response) => {
      if (response.status === 201) {
      console.log('Update meeting minutes success:', response);
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Meeting minutes updated successfully');
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
      console.error('Error updating meeting minutes:', error);
      toast.error('Failed to update meeting minutes');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      console.log('Deleting meeting minutes with ID:', id);
      return api.delete(`/meeting-minutes/delete/${id}`);
    },
    onSuccess: (response) => {
      if (response.status === 201) {
      console.log('Delete meeting minutes success:', response);
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Meeting minutes Deleted successfully');
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
      console.error('Error deleting meeting minutes:', error);
      toast.error('Failed to delete meeting minutes');
    },
  });

  const resetForm = () => {
    setFormData({
      project_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      attendees: '',
      notes: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_id) {
      toast.error('Please select a project');
      return;
    }
    
    if (!formData.attendees.trim()) {
      toast.error('Attendees are required');
      return;
    }
    
    try {
      const attendeesArray = formData.attendees.split(',').map(a => a.trim());
      
      const data = {
        project_id: formData.project_id,
        date: formData.date,
        attendees: attendeesArray,
        notes: formData.notes.trim(),
      };
      
      console.log('Submitting meeting data:', data);
      
      if (selectedMeeting && selectedMeeting.id) {
        console.log('Updating existing meeting with ID:', selectedMeeting.id);
        updateMutation.mutate({ ...data, id: selectedMeeting.id });
      } else {
        console.log('Creating new meeting');
        createMutation.mutate(data);
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      toast.error('Error in form submission');
    }
  };

  const handleEdit = (meeting: Meeting) => {
    console.log('Editing meeting:', meeting);
    setSelectedMeeting(meeting);
    
    // Process attendees field - might be an array or a string
    let attendeesString = '';
    if (Array.isArray(meeting.attendees)) {
      attendeesString = meeting.attendees.join(', ');
    } else if (typeof meeting.attendees === 'string') {
      try {
        // Try parsing as JSON first
        const parsedAttendees = JSON.parse(meeting.attendees);
        if (Array.isArray(parsedAttendees)) {
          attendeesString = parsedAttendees.join(', ');
        } else {
          attendeesString = meeting.attendees;
        }
      } catch (e) {
        // If parsing fails, use as is
        attendeesString = meeting.attendees;
      }
    }
    
    setFormData({
      project_id: meeting.project_id,
      date: format(meeting.date, 'yyyy-MM-dd'),
      attendees: attendeesString,
      notes: meeting.notes,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete these meeting minutes?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetails = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsDetailsModalOpen(true);
  };

  const getProjectName = (project_id: string) => {
    if (!project_id) return 'Unknown Project';
    const project = projects?.find((p: Project) => p.id === project_id);
    return project ? project.name : 'Unknown Project';
  };

  const getUserName = (created_by: string) => {
    if (!created_by) return 'Unknown User';
    const user = users?.find((u: User) => u.id === created_by);
    return user ? user.name : 'Unknown User';
  };

  const columns = [
    {
      header: 'Project',
      accessor: (meeting: Meeting) => getProjectName(meeting.project_id),
      sortable: true,
    },
    {
      header: 'Date',
      accessor: (meeting: Meeting) => {
        try {
          return format(new Date(meeting.date), 'MMM d, yyyy');
        } catch (error) {
          console.error('Error formatting date:', meeting.date, error);
          return meeting.date || 'Invalid date';
        }
      },
      sortable: true,
    },
    {
      header: 'Attendees',
      accessor: (meeting: Meeting) => {
        if (!meeting.attendees) return 'None';
        
        if (Array.isArray(meeting.attendees)) {
          return meeting.attendees.length > 3 
            ? `${meeting.attendees.slice(0, 3).join(', ')}... (+${meeting.attendees.length - 3} more)`
            : meeting.attendees.join(', ');
        }
        return String(meeting.attendees);
      },
      sortable: true,
    },
    {
      header: 'Created By',
      accessor: (meeting: Meeting) => getUserName(meeting.created_by!),
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (meeting: Meeting) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(meeting)}
            title="View Details"
          >
            <FileText className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(meeting)}
            title="Edit Meeting"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(meeting.id)}
            title="Delete Meeting"
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
        <h1 className="text-2xl font-bold text-gray-900">Meeting Minutes</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Meeting
        </Button>
      </div>

      {isMeetingsError && (
        <div className="p-4 border border-red-300 bg-red-50 rounded text-red-700 mb-4">
          <p className="font-medium">Error loading meeting minutes</p>
          <p className="text-sm">{meetingsError instanceof Error ? meetingsError.message : 'Unknown error'}</p>
        </div>
      )}

      {meetings && meetings.length === 0 && (
        <div className="p-4 border border-gray-300 bg-gray-50 rounded text-gray-700 mb-4">
          <p>No meeting minutes found. Create your first one!</p>
        </div>
      )}

      <Table<Meeting>
        data={(meetings || []).map((m: any) => ({
          id: m.id || 0,
          project_id: m.project_id,
          date: m.date,
          attendees: typeof m.attendees === 'string' ? 
            (m.attendees.startsWith('[') ? JSON.parse(m.attendees) : m.attendees.split(',')) : 
            m.attendees,
          notes: m.notes,
          created_by: m.created_by || "Unknown User" // This field doesn't exist in the DB
        }))}
        columns={columns}
        itemsPerPage={10}
      />

      {/* Meeting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedMeeting ? 'Edit Meeting Minutes' : 'Create Meeting Minutes'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedMeeting(null);
                  resetForm();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Project
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
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
                  Meeting Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Attendees
                </label>
                <input
                  type="text"
                  value={formData.attendees}
                  onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                  placeholder="Enter attendee names separated by commas"
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Separate names with commas</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Meeting Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={5}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                  required
                />
              </div>
              <div className="text-sm text-gray-600 italic">
                Created by: {user?.name || 'Unknown User'}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedMeeting(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedMeeting ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meeting Details Modal */}
      {isDetailsModalOpen && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Meeting for: {getProjectName(selectedMeeting.project_id)}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedMeeting(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                <h3 className="font-medium">Meeting Date:</h3>
                <p className="ml-2">{format(new Date(selectedMeeting.date), 'MMMM d, yyyy')}</p>
              </div>
              
              <div>
                <h3 className="font-medium flex items-center">
                  <Users className="w-5 h-5 mr-2 text-indigo-600" />
                  Attendees:
                </h3>
                <div className="mt-2 ml-7 space-y-1">
                  {Array.isArray(selectedMeeting.attendees) ? (
                    selectedMeeting.attendees.map((attendee, index) => (
                      <div key={index} className="px-3 py-1 bg-gray-100 rounded-full inline-block mr-2 mb-2">
                        {attendee}
                      </div>
                    ))
                  ) : (
                    <p>{selectedMeeting.attendees}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                  Meeting Notes:
                </h3>
                <div className="mt-2 ml-7 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {selectedMeeting.notes}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  Created by: {getUserName(selectedMeeting.created_by!) || 'Unknown User'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handleEdit(selectedMeeting);
                }}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Meeting
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingMinutes;