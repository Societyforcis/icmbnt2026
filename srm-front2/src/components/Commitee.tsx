"use client"

import { useState, useEffect } from "react"
import { Users, Globe, Mail, Linkedin, Twitter, Building, MapPin, Plus, Edit, Trash2, X, Save } from "lucide-react"
import PageTransition from './PageTransition';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Define types for committee members
type MemberRole =
  | "Conference Chair"
  | "Conference Co-Chair"
  | "Organizing Chair"
  | "Technical Program Chair"
  | "Publication Chair"
  | "Publicity Chair"
  | "Local Arrangement Chair"
  | "Advisory Board"
  | "Conference Coordinators"
  | "Committee Members"

interface CommitteeMember {
  _id?: string
  name: string
  role: MemberRole
  affiliation: string
  country?: string
  designation?: string
  image?: string
  links?: {
    email?: string
    website?: string
    linkedin?: string
    twitter?: string
  }
  order?: number
  active?: boolean
}

const roleFilters: MemberRole[] = [
  "Conference Chair",
  "Conference Co-Chair",
  "Organizing Chair",
  "Technical Program Chair",
  "Publication Chair",
  "Publicity Chair",
  "Local Arrangement Chair",
  "Advisory Board",
  "Conference Coordinators",
  "Committee Members"
]

const ConferenceCommittee: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null)
  const [formData, setFormData] = useState<CommitteeMember>({
    name: '',
    role: 'Committee Members',
    affiliation: '',
    country: '',
    designation: '',
    links: {}
  })


  useEffect(() => {
    // Check if user is admin AND has a valid token (logged in)
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    setIsAdmin(role === 'Admin' && !!token);

    fetchCommitteeMembers();
  }, []);

  const fetchCommitteeMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');

      // Only use admin endpoint if BOTH role is Admin AND token exists
      const isAdminWithToken = role === 'Admin' && token;

      const endpoint = isAdminWithToken
        ? '/api/committee/admin/all'
        : '/api/committee';

      const config = isAdminWithToken
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const response = await axios.get(`${API_URL}${endpoint}`, config);

      if (response.data.success) {
        setCommitteeMembers(response.data.members);
      }
    } catch (error) {
      console.error('Error fetching committee members:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load committee members',
        confirmButtonColor: '#dc2626',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      role: 'Committee Members',
      affiliation: '',
      country: '',
      designation: '',
      links: {}
    });
    setEditingMember(null);
    setShowAddModal(true);
  };

  const handleEdit = (member: CommitteeMember) => {
    setFormData(member);
    setEditingMember(member);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Delete Committee Member?',
      text: `Are you sure you want to delete ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/committee/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Committee member deleted successfully',
          confirmButtonColor: '#10b981',
        });

        fetchCommitteeMembers();
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || 'Failed to delete committee member',
          confirmButtonColor: '#dc2626',
        });
      }
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');

      if (editingMember && editingMember._id) {
        // Update existing
        await axios.put(`${API_URL}/api/committee/${editingMember._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Committee member updated successfully',
          confirmButtonColor: '#10b981',
        });
      } else {
        // Create new
        await axios.post(`${API_URL}/api/committee`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        Swal.fire({
          icon: 'success',
          title: 'Added!',
          text: 'Committee member added successfully',
          confirmButtonColor: '#10b981',
        });
      }

      setShowAddModal(false);
      fetchCommitteeMembers();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to save committee member',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/committee/${id}/toggle-active`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire({
        icon: 'success',
        title: currentStatus ? 'Deactivated!' : 'Activated!',
        text: `Committee member ${currentStatus ? 'deactivated' : 'activated'} successfully`,
        confirmButtonColor: '#10b981',
        timer: 1500
      });

      fetchCommitteeMembers();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to toggle status',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  // Filter members based on selected role
  const filteredMembers =
    selectedRole === "all" ? committeeMembers : committeeMembers.filter((member) => member.role === selectedRole)

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <header className="bg-gradient-to-r from-blue-900 to-[#F5A051] text-white py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Conference Committee</h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl">
              International Conference on Multidisciplinary Breakthroughs and NextGen Technologies - ICMBNT 2026
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto max-w-6xl px-4 py-12">
          {/* Committee Description */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-[#F5A051] mr-3" />
                <h2 className="text-3xl font-bold text-gray-800">Our Committee</h2>
              </div>
              {isAdmin && (
                <button
                  onClick={handleAddNew}
                  className="flex items-center px-4 py-2 bg-[#F5A051] text-white rounded-lg hover:bg-[#e08c3e] transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Member
                </button>
              )}
            </div>
            <p className="text-lg text-gray-600 max-w-4xl">
              The organizing committee brings together leading experts from around the world in diverse academic fields.
              Our members represent top academic institutions and industry organizations committed to fostering
              innovation and collaboration in multidisciplinary research and education.
            </p>
          </div>

          {/* Role Filter */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Filter by Role:</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedRole("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedRole === "all" ? "bg-[#F5A051] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                All Roles ({committeeMembers.length})
              </button>
              {roleFilters.map((role) => {
                const count = committeeMembers.filter(m => m.role === role).length;
                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedRole === role ? "bg-[#F5A051] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                  >
                    {role} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A051]"></div>
            </div>
          ) : (
            <>
              {/* Add/Edit Form Section - Inline (Shows at top when active) */}
              {isAdmin && showAddModal && (
                <div className="mb-12 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl p-8 border-2 border-[#F5A051] animate-fadeIn">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">
                      {editingMember ? '✏️ Edit Committee Member' : '➕ Add New Committee Member'}
                    </h2>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Close"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                        placeholder="Enter full name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as MemberRole })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                        required
                      >
                        {roleFilters.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                      <input
                        type="text"
                        value={formData.designation || ''}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                        placeholder="e.g., Professor, Associate Professor"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Affiliation *</label>
                      <input
                        type="text"
                        value={formData.affiliation}
                        onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                        placeholder="Enter institution/organization name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={formData.country || ''}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                        placeholder="e.g., India, USA, Malaysia"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-4 border-t pt-4">🔗 Links (Optional)</h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">📧 Email</label>
                      <input
                        type="email"
                        value={formData.links?.email || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          links: { ...formData.links, email: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                        placeholder="email@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">🌐 Website</label>
                      <input
                        type="url"
                        value={formData.links?.website || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          links: { ...formData.links, website: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">💼 LinkedIn</label>
                      <input
                        type="url"
                        value={formData.links?.linkedin || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          links: { ...formData.links, linkedin: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">🐦 Twitter</label>
                      <input
                        type="url"
                        value={formData.links?.twitter || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          links: { ...formData.links, twitter: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                        placeholder="https://twitter.com/username"
                      />
                    </div>

                    <div className="md:col-span-2 flex gap-4 pt-6 border-t">
                      <button
                        onClick={handleSave}
                        disabled={!formData.name || !formData.role || !formData.affiliation}
                        className="flex-1 flex items-center justify-center px-6 py-3 bg-[#F5A051] text-white rounded-lg hover:bg-[#e08c3e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-lg hover:shadow-xl"
                      >
                        <Save className="w-5 h-5 mr-2" />
                        {editingMember ? 'Update Member' : 'Add Member'}
                      </button>
                      <button
                        onClick={() => setShowAddModal(false)}
                        className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Committee Members Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredMembers.map((member) => (
                  <div
                    key={member._id}
                    className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow ${isAdmin && !member.active ? 'opacity-50 border-2 border-red-300' : ''
                      }`}
                  >
                    <div className="p-6">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-800 flex-1">{member.name}</h3>
                          {isAdmin && (
                            <div className="flex gap-2 ml-2">
                              <button
                                onClick={() => handleEdit(member)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => member._id && handleDelete(member._id, member.name)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="bg-[#F5A051]/20 text-[#F5A051] text-xs font-semibold px-2.5 py-0.5 rounded inline-block mb-1">
                          {member.role}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => member._id && handleToggleActive(member._id, member.active || false)}
                            className={`ml-2 text-xs px-2 py-0.5 rounded ${member.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}
                          >
                            {member.active ? 'Active' : 'Inactive'}
                          </button>
                        )}
                        {member.designation && (
                          <p className="text-gray-700 text-sm font-medium mt-2">{member.designation}</p>
                        )}
                        <p className="text-gray-600 text-sm flex items-center mt-1">
                          <Building className="w-3 h-3 mr-1" />
                          {member.affiliation}
                        </p>
                        {member.country && (
                          <p className="text-gray-600 text-sm flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {member.country}
                          </p>
                        )}
                      </div>

                      {/* Social Links */}
                      {member.links && Object.keys(member.links).length > 0 && (
                        <div className="mt-4 flex space-x-3">
                          {member.links.email && (
                            <a
                              href={`mailto:${member.links.email}`}
                              className="text-gray-500 hover:text-[#F5A051]"
                              aria-label={`Email ${member.name}`}
                            >
                              <Mail className="w-5 h-5" />
                            </a>
                          )}
                          {member.links.website && (
                            <a
                              href={member.links.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 hover:text-[#F5A051]"
                              aria-label={`${member.name}'s website`}
                            >
                              <Globe className="w-5 h-5" />
                            </a>
                          )}
                          {member.links.linkedin && (
                            <a
                              href={member.links.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 hover:text-[#F5A051]"
                              aria-label={`${member.name}'s LinkedIn profile`}
                            >
                              <Linkedin className="w-5 h-5" />
                            </a>
                          )}
                          {member.links.twitter && (
                            <a
                              href={member.links.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 hover:text-[#F5A051]"
                              aria-label={`${member.name}'s Twitter profile`}
                            >
                              <Twitter className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredMembers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No committee members found</p>
                </div>
              )}


            </>
          )}

          {/* Call to Action */}
          <div className="mt-16 bg-[#F5A051]/10 rounded-xl p-8 border border-[#F5A051]/20">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Contact the Committee</h3>
            <p className="text-gray-600 mb-6">
              For inquiries related to the conference, submissions, or other matters, please reach out to our committee at the email below.
            </p>
            <a
              href="mailto:icmbnt2026@gmail.com"
              className="inline-flex items-center px-6 py-3 bg-[#F5A051] text-white font-medium rounded-lg hover:bg-[#e08c3e] transition-colors"
            >
              icmbnt2026@gmail.com
              <Mail className="ml-2 w-4 h-4" />
            </a>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            <p className="text-center text-gray-400">
              © {new Date().getFullYear()} International Conference on Multidisciplinary Breakthroughs and NextGen Technologies. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

    </PageTransition>
  )
}

export default ConferenceCommittee