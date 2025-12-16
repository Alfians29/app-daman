'use client';

import { useState, useEffect, useTransition } from 'react';
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
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
import { rolesAPI, usersAPI } from '@/lib/api';

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  color: string | null;
  memberCount: number;
};

type Permission = {
  id: string;
  code: string;
  name: string;
  module: string | null;
};

type User = {
  id: string;
  name: string;
  roleId: string;
  role: { id: string; name: string; color: string | null };
};

const colorOptions = [
  { value: 'bg-gray-100 text-gray-700', label: 'Abu-abu' },
  { value: 'bg-blue-100 text-blue-700', label: 'Biru' },
  { value: 'bg-purple-100 text-purple-700', label: 'Ungu' },
  { value: 'bg-emerald-100 text-emerald-700', label: 'Hijau' },
  { value: 'bg-orange-100 text-orange-700', label: 'Oranye' },
  { value: 'bg-red-100 text-red-700', label: 'Merah' },
];

export default function ManageRolesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

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
  const [assignUserId, setAssignUserId] = useState('');
  const [assignRoleId, setAssignRoleId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [rolesResult, permsResult, usersResult] = await Promise.all([
      rolesAPI.getAll(),
      rolesAPI.getPermissions(),
      usersAPI.getAll(),
    ]);

    if (rolesResult.success) setRoles(rolesResult.data as Role[]);
    if (permsResult.success) setPermissions(permsResult.data as Permission[]);
    if (usersResult.success) setUsers(usersResult.data as User[]);
    setIsLoading(false);
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (role.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleOptions = [
    { value: '', label: 'Pilih role' },
    ...roles.map((r) => ({ value: r.id, label: r.name })),
  ];

  const userOptions = [
    { value: '', label: 'Pilih member' },
    ...users.map((u) => ({ value: u.id, label: u.name })),
  ];

  const handleAdd = async () => {
    if (!formData.name) {
      toast.error('Nama role harus diisi!');
      return;
    }

    startTransition(async () => {
      const result = await rolesAPI.create({
        name: formData.name,
        description: formData.description,
        color: formData.color,
        permissions: formData.permissions,
      });

      if (result.success) {
        toast.success('Role berhasil ditambahkan!');
        loadData();
        setShowAddModal(false);
        resetForm();
      } else {
        toast.error(result.error || 'Gagal menambahkan role');
      }
    });
  };

  const handleEdit = async () => {
    if (!selectedRole) return;

    startTransition(async () => {
      const result = await rolesAPI.update(selectedRole.id, {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        permissions: formData.permissions,
      });

      if (result.success) {
        toast.success('Role berhasil diubah!');
        loadData();
        setShowEditModal(false);
        setSelectedRole(null);
        resetForm();
      } else {
        toast.error(result.error || 'Gagal mengubah role');
      }
    });
  };

  const handleDelete = async () => {
    if (!selectedRole) return;

    startTransition(async () => {
      const result = await rolesAPI.delete(selectedRole.id);

      if (result.success) {
        toast.success('Role berhasil dihapus!');
        loadData();
        setShowDeleteModal(false);
        setSelectedRole(null);
      } else {
        toast.error(result.error || 'Gagal menghapus role');
      }
    });
  };

  const handleAssign = async () => {
    if (!assignUserId || !assignRoleId) {
      toast.error('Pilih member dan role!');
      return;
    }

    startTransition(async () => {
      const result = await usersAPI.update(assignUserId, {
        roleId: assignRoleId,
      });

      if (result.success) {
        toast.success('Role berhasil ditetapkan!');
        loadData();
        setShowAssignModal(false);
        setAssignUserId('');
        setAssignRoleId('');
      } else {
        toast.error(result.error || 'Gagal menetapkan role');
      }
    });
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
      description: role.description || '',
      permissions: role.permissions,
      color: role.color || 'bg-gray-100 text-gray-700',
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

  const togglePermission = (permCode: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permCode)
        ? prev.permissions.filter((p) => p !== permCode)
        : [...prev.permissions, permCode],
    }));
  };

  const getUsersByRole = (roleId: string) => {
    return users.filter((u) => u.roleId === roleId);
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='w-8 h-8 animate-spin text-[#E57373]' />
      </div>
    );
  }

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
              disabled={isPending}
              className='flex items-center gap-2 px-4 py-2 bg-white/20 text-white border border-white/30 rounded-xl font-medium hover:bg-white/30 transition-colors disabled:opacity-50'
            >
              <UserCheck className='w-4 h-4' />
              Tetapkan Role
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              disabled={isPending}
              className='flex items-center gap-2 px-4 py-2 bg-white text-[#E57373] rounded-xl font-medium hover:bg-white/90 transition-colors disabled:opacity-50'
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
              <p className='text-lg font-bold text-gray-800'>{users.length}</p>
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
                {permissions.length}
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
                  disabled={isPending}
                  className='p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50'
                >
                  <Edit2 size={16} />
                </button>
                {role.name !== 'Superadmin' && (
                  <button
                    onClick={() => openDeleteModal(role)}
                    disabled={isPending}
                    className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50'
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
                    {permissions.find((perm) => perm.code === p)?.name || p}
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
                {role.memberCount} member dengan role ini
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
              {users.map((user) => (
                <tr key={user.id} className='hover:bg-gray-50'>
                  <td className='px-4 py-3 text-sm text-gray-800'>
                    {user.name}
                  </td>
                  <td className='px-4 py-3'>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-lg ${user.role?.color}`}
                    >
                      {user.role?.name}
                    </span>
                  </td>
                  <td className='px-4 py-3 text-center'>
                    <button
                      onClick={() => {
                        setAssignUserId(user.id);
                        setAssignRoleId(user.roleId);
                        setShowAssignModal(true);
                      }}
                      disabled={isPending}
                      className='text-xs text-[#E57373] hover:underline disabled:opacity-50'
                    >
                      Ubah Role
                    </button>
                  </td>
                </tr>
              ))}
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
                {permissions.map((perm) => (
                  <label
                    key={perm.id}
                    className='flex items-center gap-2 cursor-pointer'
                  >
                    <input
                      type='checkbox'
                      checked={formData.permissions.includes(perm.code)}
                      onChange={() => togglePermission(perm.code)}
                      className='w-4 h-4 text-[#E57373] rounded border-gray-300 focus:ring-[#E57373]'
                    />
                    <span className='text-sm text-gray-700'>{perm.name}</span>
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
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : showAddModal ? (
              'Tambah'
            ) : (
              'Simpan'
            )}
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
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              options={userOptions}
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
          <Button
            onClick={handleAssign}
            className='flex-1'
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              'Tetapkan'
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
