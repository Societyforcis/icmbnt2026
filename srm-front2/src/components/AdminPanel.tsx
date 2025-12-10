import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Mail, User, Lock, AlertCircle, Check, Filter } from 'react-feather';
import Swal from 'sweetalert2';
import axios from 'axios';
import PageTransition from './PageTransition';
import AdminPaymentVerification from './AdminPaymentVerification';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editors, setEditors] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: '',
    username: '',
    password: ''
  });

  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('editors'); // 'editors', 'users', or 'payments'
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState('All'); // 'All', 'Admin', 'Editor', 'Reviewer', 'Author'
  const [searchTerm, setSearchTerm] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const initializeAdmin = async () => {
      await checkAdminAccess();
    };
    initializeAdmin();
  }, []);

  // Fetch editors when admin is verified
  useEffect(() => {
    if (isAdmin) {
      fetchEditors();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');

      console.log('=== ADMIN ACCESS CHECK ===');
      console.log('Token exists:', !!token);
      console.log('Role from localStorage:', role);
      console.log('API URL:', apiUrl);

      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      if (role !== 'Admin') {
        console.log('User role is not Admin:', role);
        Swal.fire({
          icon: 'error',
          title: 'Access Denied',
          text: `Only Admins can access this page. Your role: ${role}`,
          confirmButtonColor: '#F5A051'
        }).then(() => {
          navigate('/dashboard');
        });
        return;
      }

      // Verify with backend
      console.log('Verifying with backend...');
      const response = await axios.get(`${apiUrl}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Backend verification response:', response.data);

      if (response.data.success) {
        console.log('Admin access verified ✓');
        setIsAdmin(true);
      } else {
        throw new Error(response.data.message || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Admin access check failed:', error);
      console.error('Error response:', error.response?.data);
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: error.response?.data?.message || 'You do not have admin permissions',
        confirmButtonColor: '#F5A051'
      }).then(() => {
        navigate('/dashboard');
      });
    }
  };

  const fetchEditors = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      console.log('🔍 Fetching editors from:', `${apiUrl}/api/admin/editors`);
      console.log('Token available:', !!token);

      const response = await axios.get(`${apiUrl}/api/admin/editors`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Raw response:', response.data);
      console.log('Response count:', response.data.count);
      console.log('Response editors:', response.data.editors);

      // Log debug info from backend
      if (response.data.debug) {
        console.log('🐛 Backend Debug Info:');
        console.log('  Total users in DB:', response.data.debug.totalUsers);
        console.log('  Roles in DB:', response.data.debug.rolesInDB);
      }

      if (response.data.success) {
        const editorsList = response.data.editors || [];
        console.log(`✅ Successfully loaded ${editorsList.length} editors`);
        setEditors(editorsList);

        // If no editors found but DB has users, log warning
        if (editorsList.length === 0 && response.data.debug?.totalUsers > 0) {
          console.warn('⚠️  WARNING: Database has users but no editors found!');
          console.warn('Debug roles:', response.data.debug?.rolesInDB);
        }
      } else {
        console.error('❌ API returned success: false', response.data);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Load Editors',
          text: response.data.message || 'Could not load editors',
          confirmButtonColor: '#F5A051'
        });
      }
    } catch (error: any) {
      console.error('❌ Error fetching editors:');
      console.error('  Message:', error.message);
      console.error('  Status:', error.response?.status);
      console.error('  Data:', error.response?.data);

      Swal.fire({
        icon: 'error',
        title: 'Failed to Fetch Editors',
        text: error.response?.data?.message || error.message || 'Could not load editors',
        confirmButtonColor: '#F5A051'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.get(`${apiUrl}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const usersList = response.data.users || [];
        setAllUsers(usersList);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Load Users',
          text: response.data.message || 'Could not load users',
          confirmButtonColor: '#F5A051'
        });
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Fetch Users',
        text: error.response?.data?.message || error.message || 'Could not load users',
        confirmButtonColor: '#F5A051'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    try {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Delete User?',
        text: `Are you sure you want to delete ${userEmail}? This action cannot be undone.`,
        confirmButtonColor: '#F5A051',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem('token');

        const response = await axios.delete(
          `${apiUrl}/api/admin/users/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: `User ${userEmail} has been deleted`,
            confirmButtonColor: '#F5A051'
          });

          // Refresh users list
          if (activeTab === 'users') {
            fetchAllUsers();
          } else {
            fetchEditors();
          }
        }
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Delete',
        text: error.response?.data?.message || 'Could not delete user',
        confirmButtonColor: '#F5A051'
      });
    }
  };

  const handleCreateEditor = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!createFormData.email || !createFormData.username || !createFormData.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in all fields',
        confirmButtonColor: '#F5A051'
      });
      return;
    }

    if (createFormData.password.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Password Too Short',
        text: 'Password must be at least 6 characters',
        confirmButtonColor: '#F5A051'
      });
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${apiUrl}/api/admin/editors`,
        {
          email: createFormData.email,
          username: createFormData.username,
          password: createFormData.password
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        const emailMessage = response.data.emailSent
          ? `\n\n✅ Credentials email has been sent to ${createFormData.email}`
          : `\n\n⚠️  Note: Email could not be sent (editor created successfully)`;

        Swal.fire({
          icon: 'success',
          title: 'Editor Created Successfully',
          html: `<div style="text-align: left;">
                   <p><strong>${createFormData.email}</strong> has been created as an Editor</p>
                   <p style="color: #F5A051; font-weight: bold;">${emailMessage}</p>
                 </div>`,
          confirmButtonColor: '#F5A051'
        });

        // Reset form
        setCreateFormData({ email: '', username: '', password: '' });
        setShowCreateForm(false);

        // Refresh editors list
        fetchEditors();
      }
    } catch (error: any) {
      console.error('Error creating editor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Create Editor',
        text: error.response?.data?.message || 'Could not create editor',
        confirmButtonColor: '#F5A051'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEditor = async (editorId: string, editorEmail: string) => {
    try {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Delete Editor?',
        text: `Are you sure you want to delete ${editorEmail}? This action cannot be undone.`,
        confirmButtonColor: '#F5A051',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        setDeleteLoading(editorId);
        const token = localStorage.getItem('token');

        const response = await axios.delete(
          `${apiUrl}/api/admin/users/${editorId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: `Editor ${editorEmail} has been deleted`,
            confirmButtonColor: '#F5A051'
          });

          // Refresh editors list
          fetchEditors();
        }
      }
    } catch (error: any) {
      console.error('Error deleting editor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Delete',
        text: error.response?.data?.message || 'Could not delete editor',
        confirmButtonColor: '#F5A051'
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A051] mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Manage editors and system users</p>
          </div>

          {/* Tabs Navigation */}
          <div className="mb-8 flex gap-4 border-b border-gray-200">
            <button
              onClick={() => { setActiveTab('editors'); fetchEditors(); }}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'editors'
                ? 'border-[#F5A051] text-[#F5A051]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              👥 Editors Management
            </button>
            <button
              onClick={() => { setActiveTab('users'); fetchAllUsers(); }}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'users'
                ? 'border-[#F5A051] text-[#F5A051]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              👤 All Users
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'payments'
                ? 'border-[#F5A051] text-[#F5A051]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
              💳 Payment Verification
            </button>
          </div>

          {/* Editors Tab - Two Column Layout */}
          {activeTab === 'editors' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT COLUMN - Create Editor Form */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Create New Editor</h2>
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center px-4 py-2 bg-[#F5A051] text-white rounded-lg hover:bg-[#e08c3e] transition-colors"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {showCreateForm ? 'Cancel' : 'Add Editor'}
                  </button>
                </div>

                {showCreateForm && (
                  <form onSubmit={handleCreateEditor} className="space-y-4 bg-white p-6 rounded-lg border border-gray-200 shadow-md">
                    <div className="space-y-4">
                      {/* Email Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Mail className="w-4 h-4 inline mr-2" />
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={createFormData.email}
                          onChange={(e) =>
                            setCreateFormData({ ...createFormData, email: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A051] focus:border-[#F5A051]"
                          placeholder="editor@example.com"
                        />
                      </div>

                      {/* Username Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User className="w-4 h-4 inline mr-2" />
                          Username
                        </label>
                        <input
                          type="text"
                          required
                          value={createFormData.username}
                          onChange={(e) =>
                            setCreateFormData({ ...createFormData, username: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A051] focus:border-[#F5A051]"
                          placeholder="editor_name"
                        />
                      </div>

                      {/* Password Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Lock className="w-4 h-4 inline mr-2" />
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          value={createFormData.password}
                          onChange={(e) =>
                            setCreateFormData({ ...createFormData, password: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A051] focus:border-[#F5A051]"
                          placeholder="Min 6 characters"
                          minLength={6}
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`px-6 py-2 bg-[#F5A051] text-white rounded-lg font-medium transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#e08c3e]'
                          }`}
                      >
                        {isLoading ? 'Creating...' : 'Create Editor'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* RIGHT COLUMN - Editors List Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Current Editors</h2>

                {isLoading && editors.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A051] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading editors...</p>
                  </div>
                ) : editors.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No editors created yet</p>
                    <p className="text-gray-500">Click "Add Editor" above to create one</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {editors.map((editor) => (
                      <div
                        key={editor._id}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                      >
                        {/* Editor Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{editor.username}</h3>
                            <p className="text-sm text-gray-600 mt-1">{editor.email}</p>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            <Check className="w-4 h-4 mr-1" />
                            Editor
                          </span>
                        </div>

                        {/* Editor Stats */}
                        <div className="space-y-2 mb-3 pb-3 border-b border-blue-200">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Created:</span>{' '}
                            {new Date(editor.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Status:</span>{' '}
                            <span className="text-green-600">Verified ✓</span>
                          </p>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteEditor(editor._id, editor.email)}
                          disabled={deleteLoading === editor._id}
                          className="w-full flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-70 text-sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {deleteLoading === editor._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Editors Count */}
                {editors.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Total Editors: <span className="font-semibold text-gray-900">{editors.length}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users Tab - Two Column Layout */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT COLUMN - Filters & Search */}
              <div className="lg:col-span-1">
                {/* Role Filter */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Role</h2>
                  <div className="space-y-2">
                    {['All', 'Admin', 'Editor', 'Reviewer', 'Author'].map((role) => (
                      <button
                        key={role}
                        onClick={() => setRoleFilter(role)}
                        className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${roleFilter === role
                          ? 'bg-[#F5A051] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        <Filter className="w-4 h-4 inline mr-2" />
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Users</h2>
                  <input
                    type="text"
                    placeholder="Email or username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A051] focus:border-[#F5A051]"
                  />
                </div>
              </div>

              {/* RIGHT COLUMN - Users List */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">All Users</h2>

                  {allUsers.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">No users found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allUsers
                        .filter((user) => roleFilter === 'All' || user.role === roleFilter)
                        .filter((user) =>
                          searchTerm === '' ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.username.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((user) => (
                          <div
                            key={user._id}
                            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${user.role === 'Admin' ? 'bg-red-50 border-red-200' :
                              user.role === 'Editor' ? 'bg-blue-50 border-blue-200' :
                                user.role === 'Reviewer' ? 'bg-green-50 border-green-200' :
                                  'bg-yellow-50 border-yellow-200'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <h3 className="font-semibold text-gray-900">{user.username}</h3>
                                    <p className="text-sm text-gray-600">{user.email}</p>
                                  </div>
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${user.role === 'Admin' ? 'bg-red-100 text-red-800' :
                                    user.role === 'Editor' ? 'bg-blue-100 text-blue-800' :
                                      user.role === 'Reviewer' ? 'bg-green-100 text-green-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {user.role}
                                  </span>
                                </div>
                                <div className="mt-2 flex gap-4 text-xs text-gray-600">
                                  <span>📅 {new Date(user.createdAt).toLocaleDateString()}</span>
                                  <span>{user.verified ? '✅ Verified' : '⏳ Pending'}</span>
                                </div>
                              </div>

                              <button
                                onClick={() => handleDeleteUser(user._id, user.email)}
                                disabled={deleteLoading === user._id}
                                className="ml-4 flex items-center px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-70 text-sm whitespace-nowrap"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                {deleteLoading === user._id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Users Count */}
                  {allUsers.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Displaying: <span className="font-semibold text-gray-900">{allUsers.filter((u) => roleFilter === 'All' || u.role === roleFilter).filter((u) => searchTerm === '' || u.email.toLowerCase().includes(searchTerm.toLowerCase()) || u.username.toLowerCase().includes(searchTerm.toLowerCase())).length}</span> / {allUsers.length} users
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Verification Tab */}
          {activeTab === 'payments' && (
            <AdminPaymentVerification />
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminPanel;
