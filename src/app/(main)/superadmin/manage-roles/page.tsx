'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  Users,
  UserCheck,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { teamMembers } from '@/data/dummy';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ConfirmModal,
} from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Form';

type Role = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  memberCount: number;
};

type RoleAssignment = {
  memberId: string;
  memberName: string;
  roleId: string;
};

const availablePermissions = [
  { id: 'view_dashboard', label: 'Lihat Dashboard' },
  { id: 'manage_attendance', label: 'Kelola Kehadiran' },
  { id: 'manage_schedule', label: 'Kelola Jadwal' },
  { id: 'manage_cash', label: 'Kelola Kas' },
  { id: 'manage_members', label: 'Kelola Anggota' },
  { id: 'manage_roles', label: 'Kelola Role' },
  { id: 'view_audit_log', label: 'Lihat Audit Log' },
  { id: 'export_data', label: 'Export Data' },
];

const initialRoles: Role[] = [
  {
    id: 'superadmin',
    name: 'Superadmin',
    description: 'Akses penuh ke semua fitur sistem',
    permissions: availablePermissions.map((p) => p.id),
    color: 'bg-purple-100 text-purple-700',
    memberCount: 1,
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Dapat mengelola kehadiran, jadwal, dan kas',
    permissions: [
      'view_dashboard',
      'manage_attendance',
      'manage_schedule',
      'manage_cash',
    ],
    color: 'bg-blue-100 text-blue-700',
    memberCount: 3,
  },
  {
    id: 'member',
    name: 'Member',
    description: 'Dapat melihat dashboard dan mengisi absensi',
    permissions: ['view_dashboard'],
    color: 'bg-gray-100 text-gray-700',
    memberCount: 10,
  },
];

const initialAssignments: RoleAssignment[] = teamMembers
  .slice(0, 5)
  .map((m, i) => ({
    memberId: m.id,
    memberName: m.name,
    roleId: i === 0 ? 'superadmin' : i < 3 ? 'admin' : 'member',
  }));

const colorOptions = [
  { value: 'bg-gray-100 text-gray-700', label: 'Abu-abu' },
  { value: 'bg-blue-100 text-blue-700', label: 'Biru' },
  { value: 'bg-purple-100 text-purple-700', label: 'Ungu' },
  { value: 'bg-emerald-100 text-emerald-700', label: 'Hijau' },
  { value: 'bg-orange-100 text-orange-700', label: 'Oranye' },
  { value: 'bg-red-100 text-red-700', label: 'Merah' },
];

const memberOptions = [
  { value: '', label: 'Pilih member' },
  ...teamMembers.map((m) => ({ value: m.id, label: m.name })),
];

export default function ManageRolesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [assignments, setAssignments] =
    useState<RoleAssignment[]>(initialAssignments);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    color: 'bg-gray-100 text-gray-700',
  });

  // Assignment form
  const [assignMemberId, setAssignMemberId] = useState('');
  const [assignRoleId, setAssignRoleId] = useState('');

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleOptions = [
    { value: '', label: 'Pilih role' },
    ...roles.map((r) => ({ value: r.id, label: r.name })),
  ];

  const handleAdd = () => {
    if (!formData.name) {
      toast.error('Nama role harus diisi!');
      return;
    }

    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions,
      color: formData.color,
      memberCount: 0,
    };

    setRoles([...roles, newRole]);
    setShowAddModal(false);
    resetForm();
    toast.success('Role berhasil ditambahkan!');
  };

  const handleEdit = () => {
    if (!selectedRole) return;

    setRoles(
      roles.map((r) =>
        r.id === selectedRole.id
          ? {
              ...r,
              name: formData.name,
              description: formData.description,
              permissions: formData.permissions,
              color: formData.color,
            }
          : r
      )
    );
    setShowEditModal(false);
    setSelectedRole(null);
    resetForm();
    toast.success('Role berhasil diubah!');
  };

  const handleDelete = () => {
    if (!selectedRole) return;
    if (selectedRole.id === 'superadmin') {
      toast.error('Role Superadmin tidak dapat dihapus!');
      return;
    }

    setRoles(roles.filter((r) => r.id !== selectedRole.id));
    setAssignments(assignments.filter((a) => a.roleId !== selectedRole.id));
    setShowDeleteModal(false);
    setSelectedRole(null);
    toast.success('Role berhasil dihapus!');
  };

  const handleAssign = () => {
    if (!assignMemberId || !assignRoleId) {
      toast.error('Pilih member dan role!');
      return;
    }

    const member = teamMembers.find((m) => m.id === assignMemberId);
    if (!member) return;

    // Remove existing assignment for this member
    const newAssignments = assignments.filter(
      (a) => a.memberId !== assignMemberId
    );
    newAssignments.push({
      memberId: member.id,
      memberName: member.name,
      roleId: assignRoleId,
    });

    setAssignments(newAssignments);
    setShowAssignModal(false);
    setAssignMemberId('');
    setAssignRoleId('');
    toast.success('Role berhasil ditetapkan!');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
      color: 'bg-gray-100 text-gray-700',
    });
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      color: role.color,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (role: Role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedRole(null);
    resetForm();
  };

  const togglePermission = (permId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const getMembersByRole = (roleId: string) => {
    return assignments.filter((a) => a.roleId === roleId);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <PageHeader
        title='Manajemen Role'
        description='Kelola role dan hak akses pengguna'
        icon={ShieldCheck}
        actions={
          <>
            <button
              onClick={() => setShowAssignModal(true)}
              className='flex items-center gap-2 px-4 py-2 bg-white/20 text-white border border-white/30 rounded-xl font-medium hover:bg-white/30 transition-colors'
            >
              <UserCheck className='w-4 h-4' />
              Tetapkan Role
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className='flex items-center gap-2 px-4 py-2 bg-white text-[#E57373] rounded-xl font-medium hover:bg-white/90 transition-colors'
            >
              <Plus className='w-4 h-4' />
              Tambah Role
            </button>
          </>
        }
      />

      {/* Summary Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center'>
              <Shield className='w-5 h-5 text-purple-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Total Role</p>
              <p className='text-lg font-bold text-gray-800'>{roles.length}</p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center'>
              <Users className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Total Anggota</p>
              <p className='text-lg font-bold text-gray-800'>
                {assignments.length}
              </p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center'>
              <Settings className='w-5 h-5 text-emerald-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Total Permission</p>
              <p className='text-lg font-bold text-gray-800'>
                {availablePermissions.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
        <input
          type='text'
          placeholder='Cari role...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
        />
      </div>

      {/* Roles Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {filteredRoles.map((role) => (
          <Card key={role.id} className='relative'>
            <div className='flex items-start justify-between mb-3'>
              <div className='flex items-center gap-2'>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-lg ${role.color}`}
                >
                  {role.name}
                </span>
              </div>
              <div className='flex gap-1'>
                <button
                  onClick={() => openEditModal(role)}
                  className='p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                >
                  <Edit2 size={16} />
                </button>
                {role.id !== 'superadmin' && (
                  <button
                    onClick={() => openDeleteModal(role)}
                    className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <p className='text-sm text-gray-600 mb-3'>{role.description}</p>

            <div className='mb-3'>
              <p className='text-xs text-gray-500 mb-1'>Permissions:</p>
              <div className='flex flex-wrap gap-1'>
                {role.permissions.slice(0, 3).map((p) => (
                  <span
                    key={p}
                    className='px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded'
                  >
                    {availablePermissions.find((ap) => ap.id === p)?.label}
                  </span>
                ))}
                {role.permissions.length > 3 && (
                  <span className='px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded'>
                    +{role.permissions.length - 3} lainnya
                  </span>
                )}
              </div>
            </div>

            <div className='pt-3 border-t'>
              <p className='text-xs text-gray-500'>
                {getMembersByRole(role.id).length} member dengan role ini
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Member Role Assignments */}
      <Card>
        <h3 className='text-lg font-semibold text-gray-800 mb-4'>
          Penetapan Role Member
        </h3>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Member
                </th>
                <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Role
                </th>
                <th className='text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase'>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {assignments.map((assignment) => {
                const role = roles.find((r) => r.id === assignment.roleId);
                return (
                  <tr key={assignment.memberId} className='hover:bg-gray-50'>
                    <td className='px-4 py-3 text-sm text-gray-800'>
                      {assignment.memberName}
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-lg ${role?.color}`}
                      >
                        {role?.name}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-center'>
                      <button
                        onClick={() => {
                          setAssignMemberId(assignment.memberId);
                          setAssignRoleId(assignment.roleId);
                          setShowAssignModal(true);
                        }}
                        className='text-xs text-[#E57373] hover:underline'
                      >
                        Ubah Role
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Role Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={closeModal}
        size='md'
      >
        <ModalHeader
          title={showAddModal ? 'Tambah Role' : 'Edit Role'}
          subtitle='Kelola hak akses sistem'
          onClose={closeModal}
        />
        <ModalBody>
          <div className='space-y-4'>
            <Input
              label='Nama Role'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder='Contoh: Editor'
            />

            <Textarea
              label='Deskripsi'
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder='Deskripsi singkat tentang role ini'
              rows={2}
            />

            <Select
              label='Warna Badge'
              value={formData.color}
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value })
              }
              options={colorOptions}
            />

            <div>
              <label className='block text-xs text-gray-500 mb-2'>
                Permissions
              </label>
              <div className='space-y-2 max-h-40 overflow-auto p-2 bg-gray-50 rounded-lg'>
                {availablePermissions.map((perm) => (
                  <label
                    key={perm.id}
                    className='flex items-center gap-2 cursor-pointer'
                  >
                    <input
                      type='checkbox'
                      checked={formData.permissions.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className='w-4 h-4 text-[#E57373] rounded border-gray-300 focus:ring-[#E57373]'
                    />
                    <span className='text-sm text-gray-700'>{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant='secondary' onClick={closeModal} className='flex-1'>
            Batal
          </Button>
          <Button
            onClick={showAddModal ? handleAdd : handleEdit}
            className='flex-1'
          >
            {showAddModal ? 'Tambah' : 'Simpan'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal && !!selectedRole}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title='Hapus Role?'
        message={`Role "${selectedRole?.name}" akan dihapus. Member dengan role ini akan menjadi tidak memiliki role.`}
        confirmText='Hapus'
        cancelText='Batal'
        variant='danger'
      />

      {/* Assign Role Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        size='sm'
      >
        <ModalHeader
          title='Tetapkan Role'
          subtitle='Pilih member dan role'
          onClose={() => setShowAssignModal(false)}
        />
        <ModalBody>
          <div className='space-y-4'>
            <Select
              label='Member'
              value={assignMemberId}
              onChange={(e) => setAssignMemberId(e.target.value)}
              options={memberOptions}
            />

            <Select
              label='Role'
              value={assignRoleId}
              onChange={(e) => setAssignRoleId(e.target.value)}
              options={roleOptions}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant='secondary'
            onClick={() => setShowAssignModal(false)}
            className='flex-1'
          >
            Batal
          </Button>
          <Button onClick={handleAssign} className='flex-1'>
            Tetapkan
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
