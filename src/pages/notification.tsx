import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Bell, X, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../api/axios';
import Button from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import type { Notification } from '../types/notification'

const Notification = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState({
    message: '',
  });
  const [showPopup, setShowPopup] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications, isError: isNotificationsError, error: notificationsError } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const response = await api.get('/notifications/select');
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
    },
  });

  // Check for unread notifications
  useEffect(() => {
    if (notifications) {
      const unread = notifications.filter((n: Notification) => n.status === 'unread').length;
      setUnreadCount(unread);
      if (unread > 0) {
        setShowPopup(true);
      }
    }
  }, [notifications]);

  
  const createMutation = useMutation({
    mutationFn: (data: Omit<Notification, 'id' | 'status'>) => {
      return api.post('/notifications/create', data);
    },
    onSuccess: (response) => {
      if (response.status === 201){
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Notification created successfully');
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

  
  // const updateMutation = useMutation({
  //   mutationFn: (data: { id: number; message: string }) => 
  //     api.put(`/notifications/${data.id}`, { message: data.message }),
  
  //   onSuccess: (response) => {
  //     if (response.status === 200) {
  //       queryClient.invalidateQueries({ queryKey: ['notifications'] });
  //       toast.success('Notification updated successfully');
  //     } else {
  //       toast.error(`Error ${response.status}: ${response.data?.error || "Update failed"}`);
  //     }
  //   },
  //   onError: (error) => {
  //     console.error('Error updating notification:', error);
  //     toast.error('Failed to update notification');
  //   },
  // });
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      return api.delete(`/notifications/delete/${id}`);
    },
    onSuccess: (response) => {
      if (response.status === 201){
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Notification deleted successfully');
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
    onError: () => toast.error('Failed to delete notification'),
  });

  const resetForm = () => {
    setFormData({
      message: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      toast.error('Message is required');
      return;
    }
    createMutation.mutate({
      message: formData.message.trim()
    });
  };

  const handleViewDetails = async (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDetailsModalOpen(true);
  };

  const handleStatusUpdate = async (notification: Notification) => {
    if (notification.status === 'unread') {
      try {
        console.log('Attempting to mark notification as read:', notification.id);
        // Make API call to mark as read
        const response = await api.put(`/notifications/mark-read/${notification.id}`);
        console.log('API Response:', response.data);
        
        // Optimistically update the notification in the list
        queryClient.setQueryData(['notifications'], (oldData: Notification[] | undefined) => {
          if (!oldData) return [];
          return oldData.map(n => 
            n.id === notification.id ? { ...n, status: 'read' } : n
          );
        });
        
        // Update unread count and popup
        setUnreadCount(prev => Math.max(0, prev - 1));
        if (unreadCount <= 1) {
          setShowPopup(false);
        }
        
        // Update the selected notification status
        setSelectedNotification(prev => prev ? { ...prev, status: 'read' } : null);
        
        toast.success('Notification marked as read');
      } catch (error) {
        console.error('Error updating notification status:', error);
        toast.error('Failed to mark notification as read');
      }
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    {
      header: 'Status',
      accessor: (notification: Notification) => (
        <div className="flex items-center">
          {notification.status === 'unread' ? (
            <Bell className="w-4 h-4 text-blue-500 animate-pulse" />
          ) : (
            <Check className="w-4 h-4 text-green-500" />
          )}
          <span className={`ml-2 capitalize ${notification.status === 'unread' ? 'font-medium text-blue-600' : 'text-gray-600'}`}>
            {notification.status}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      header: 'Message',
      accessor: (notification: Notification) => (
        <div className="max-w-md truncate">{notification.message}</div>
      ),
      sortable: true,
    },
    {
      header: 'Created At',
      accessor: (notification: Notification) => 
        notification.created_at ? format(new Date(notification.created_at), 'MMM d, yyyy HH:mm') : 'N/A',
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (notification: Notification) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(notification)}
            title="View Details"
          >
          
            <Bell className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(notification.id)}
            title="Delete Notification"
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
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Notification
        </Button>
      </div>

      {isNotificationsError && (
        <div className="p-4 border border-red-300 bg-red-50 rounded text-red-700 mb-4">
          <p className="font-medium">Error loading notifications</p>
          <p className="text-sm">{notificationsError instanceof Error ? notificationsError.message : 'Unknown error'}</p>
        </div>
      )}

      {notifications && notifications.length === 0 && (
        <div className="p-4 border border-gray-300 bg-gray-50 rounded text-gray-700 mb-4">
          <p>No notifications found. Create your first one!</p>
        </div>
      )}

      <Table<Notification>
        data={notifications || []}
        columns={columns}
        itemsPerPage={10}
      />

      {/* Create Notification Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create Notification</h2>
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
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
                  required
                />
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
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Details Modal */}
      {isDetailsModalOpen && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Notification Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedNotification(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Bell className={`w-5 h-5 mr-2 ${selectedNotification.status === 'unread' ? 'text-blue-500 animate-pulse' : 'text-green-500'}`} />
                <h3 className="font-medium">Status:</h3>
                <span className={`ml-2 capitalize ${selectedNotification.status === 'unread' ? 'font-medium text-blue-600' : 'text-gray-600'}`}>
                  {selectedNotification.status}
                </span>
              </div>
              
              <div>
                <h3 className="font-medium">Message:</h3>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {selectedNotification.message}
                </div>
              </div>

              {selectedNotification.created_at && (
                <div className="text-sm text-gray-600">
                  Created at: {format(new Date(selectedNotification.created_at), 'MMMM d, yyyy HH:mm')}
                </div>
              )}
            </div>

            {selectedNotification.status === 'unread' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleStatusUpdate(selectedNotification); 
                    setIsDetailsModalOpen(false);
                    setSelectedNotification(null);
                  }}
                  className="w-full"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Read
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unread Notifications Popup */}
      {showPopup && unreadCount > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-50 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">New Notifications</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPopup(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              setShowPopup(false)
              setIsDetailsModalOpen(true)
            }}
          >
            View Notifications
          </Button>
        </div>
      )}
    </div>
  );
};

export default Notification; 