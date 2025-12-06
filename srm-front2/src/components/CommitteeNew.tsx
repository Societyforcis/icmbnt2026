"use client"

import { useState, useEffect } from "react"
import { Users, Globe, Mail, Linkedin, Twitter, Building, MapPin, Edit2, Save, X, Plus, Trash2 } from "lucide-react"
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
  image: string
  links?: {
    email?: string
    website?: string
    linkedin?: string
    twitter?: string
  }
  order?: number
}

// Updated filter options for committee roles
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CommitteeMember | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Check if user is admin
  useEffect(() => {
    const role = localStorage.getItem('role');
    setIsAdmin(role === 'admin');
  }, []);

  // Fetch committee members
  useEffect(() => {
    fetchCommitteeMembers();
  }, []);

  const fetchCommitteeMembers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/committee`);
      if (response.data.success) {
        setCommitteeMembers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching committee members:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load committee members'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter members based on selected role
  const filteredMembers =
    selectedRole === "all" ? committeeMembers : committeeMembers.filter((member) => member.role === selectedRole)

  // Handle edit click
  const handleEditClick = (member: CommitteeMember) => {
    setEditingId(member._id || null);
    setEditForm({ ...member });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editForm || !editingId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/committee/${editingId}`,
        editForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Committee member updated successfully',
          timer: 2000
        });
        fetchCommitteeMembers();
        setEditingId(null);
        setEditForm(null);
      }
    } catch (error) {
      console.error('Error updating committee member:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update committee member'
      });
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
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
          text: 'Committee member has been deleted.',
          timer: 2000
        });
        fetchCommitteeMembers();
      } catch (error) {
        console.error('Error deleting committee member:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete committee member'
        });
      }
    }
  };

  // Handle add new member
  const handleAddMember = async (newMember: CommitteeMember) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/committee`,
        newMember,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Committee member added successfully',
          timer: 2000
        });
        fetchCommitteeMembers();
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding committee member:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add committee member'
      });
    }
  };

  // Render edit form
  const renderEditForm = (member: CommitteeMember, isEditing: boolean) => {
    if (!isEditing || !editForm) {
      return (
        <div>
          <h3 className="text-xl font-bold text-gray-800">{member.name}</h3>
          <div className="bg-[#F5A051]/20 text-[#F5A051] text-xs font-semibold px-2.5 py-0.5 rounded inline-block mb-1">
            {member.role}
          </div>
          {member.designation && (
            <p className="text-gray-700 text-sm font-medium">{member.designation}</p>
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
      );
    }

    return (
      <div className="space-y-3">
        <input
          type="text"
          value={editForm.name}
          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
          placeholder="Name"
        />
        <select
          value={editForm.role}
          onChange={(e) => setEditForm({ ...editForm, role: e.target.value as MemberRole })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
        >
          {roleFilters.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <input
          type="text"
          value={editForm.designation || ''}
          onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
          placeholder="Designation"
        />
        <textarea
          value={editForm.affiliation}
          onChange={(e) => setEditForm({ ...editForm, affiliation: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
          placeholder="Affiliation"
          rows={2}
        />
        <input
          type="text"
          value={editForm.country || ''}
          onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
          placeholder="Country"
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A051]"></div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <header className="bg-gradient-to-r from-blue-900 to-[#F5A051] text-white py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Conference Committee</h1>
                <p className="text-xl md:text-2xl opacity-90 max-w-3xl">
                  International Conference on Multidisciplinary Breakthroughs and NextGen Technologies - ICMBNT 2026
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-white text-[#F5A051] px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add Member
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto max-w-6xl px-4 py-12">
          {/* Committee Description */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Users className="w-8 h-8 text-[#F5A051] mr-3" />
              <h2 className="text-3xl font-bold text-gray-800">Our Committee</h2>
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
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedRole === "all" ? "bg-[#F5A051] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All Roles
              </button>
              {roleFilters.map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedRole === role ? "bg-[#F5A051] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Committee Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMembers.map((member) => {
              const isEditing = editingId === member._id;
              return (
                <div
                  key={member._id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow relative"
                >
                  <div className="p-6">
                    {renderEditForm(member, isEditing)}

                    {/* Social Links - Only show if links are provided and not editing */}
                    {!isEditing && member.links && Object.keys(member.links).length > 0 && (
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

                    {/* Admin Controls */}
                    {isAdmin && (
                      <div className="mt-4 flex gap-2">
                        {!isEditing ? (
                          <>
                            <button
                              onClick={() => handleEditClick(member)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                            >
                              <Edit2 size={14} />
                              Edit
                            </button>
                            <button
                              onClick={() => member._id && handleDelete(member._id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                            >
                              <Save size={14} />
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                            >
                              <X size={14} />
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Member Modal */}
          {showAddForm && isAdmin && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold mb-4">Add New Committee Member</h3>
                <AddMemberForm
                  onSubmit={handleAddMember}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            </div>
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

// Add Member Form Component
const AddMemberForm: React.FC<{
  onSubmit: (member: CommitteeMember) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CommitteeMember>({
    name: '',
    role: 'Committee Members',
    affiliation: '',
    country: '',
    designation: '',
    image: '/placeholder.svg?height=300&width=300',
    links: {
      email: '',
      website: '',
      linkedin: '',
      twitter: ''
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
        <select
          required
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as MemberRole })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
        >
          {roleFilters.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
        <input
          type="text"
          value={formData.designation}
          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Affiliation *</label>
        <textarea
          required
          value={formData.affiliation}
          onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
        <input
          type="text"
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.links?.email}
            onChange={(e) => setFormData({ ...formData, links: { ...formData.links, email: e.target.value } })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input
            type="url"
            value={formData.links?.website}
            onChange={(e) => setFormData({ ...formData, links: { ...formData.links, website: e.target.value } })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
          <input
            type="url"
            value={formData.links?.linkedin}
            onChange={(e) => setFormData({ ...formData, links: { ...formData.links, linkedin: e.target.value } })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
          <input
            type="url"
            value={formData.links?.twitter}
            onChange={(e) => setFormData({ ...formData, links: { ...formData.links, twitter: e.target.value } })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-[#F5A051] text-white px-4 py-2 rounded-md hover:bg-[#e08c3e] transition-colors font-medium"
        >
          Add Member
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ConferenceCommittee
