'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  Phone,
  Mail,
  AtSign,
  UsersRound,
  Loader2,
  Shield,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/Skeleton';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ConfirmModal,
} from '@/components/ui/Modal';
import { Input, Select, FormRow } from '@/components/ui/Form';
import toast from 'react-hot-toast';
import { usersAPI } from '@/lib/api';

type User = {
  id: string;
  nik: string;
  username: string;
  name: string;
  nickname: string | null;
  email: string;
  position: string;
  department: string;
  image: string | null;
  usernameTelegram: string | null;
  phone: string | null;
  roleId: string;
  isActive: boolean;
  role: { id: string; name: string; color: string | null };
};

type Role = {
  id: string;
  name: string;
  color: string | null;
};

type MemberForm = {
  nik: string;
  username: string;
  password: string;
  name: string;
  nickname: string;
  email: string;
  position: string;
  department: string;
  usernameTelegram: string;
  phone: string;
  roleId: string;
};

const positionOptions = [
  { value: 'Team Leader', label: 'Team Leader' },
  { value: 'Member', label: 'Member' },
];

const departmentOptions = [
  { value: 'Data Management - TA', label: 'Data Management - TA' },
  { value: 'Data Management - ISH', label: 'Data Management - ISH' },
];

export default function AdminTeamPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [members, setMembers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState<MemberForm>({
    nik: '',
    username: '',
    password: '',
    name: '',
    nickname: '',
    email: '',
    position: 'Member',
    department: 'Data Management - TA',
    usernameTelegram: '',
    phone: '',
    roleId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [usersResult, rolesResult] = await Promise.all([
      usersAPI.getAll(),
      usersAPI.getRolesForSelect(),
    ]);

    if (usersResult.success) setMembers(usersResult.data as User[]);
    if (rolesResult.success) {
      const rolesData = rolesResult.data as Role[];
      setRoles(rolesData);
      // Set default roleId if available
      if (rolesData && rolesData.length > 0) {
        const memberRole = rolesData.find((r) => r.name === 'Member');
        if (memberRole) {
          setFormData((prev) => ({ ...prev, roleId: memberRole.id }));
        }
      }
    }
    setIsLoading(false);
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition =
      filterPosition === 'all' || member.position === filterPosition;
    return matchesSearch && matchesPosition;
  });

  // Add member
  const handleAdd = async () => {
    if (
      !formData.name ||
      !formData.username ||
      !formData.nik ||
      !formData.email
    ) {
      toast.error('NIK, Username, Nama, dan Email harus diisi!');
      return;
    }

    if (!formData.password) {
      toast.error('Password harus diisi!');
      return;
    }

    startTransition(async () => {
      const result = await usersAPI.create({
        nik: formData.nik,
        username: formData.username,
        password: formData.password,
        name: formData.name,
        nickname: formData.nickname || formData.name.split(' ')[0],
        email: formData.email,
        position: formData.position,
        department: formData.department,
        usernameTelegram: formData.usernameTelegram || undefined,
        phone: formData.phone || undefined,
        roleId: formData.roleId,
      });

      if (result.success) {
        toast.success('Member berhasil ditambahkan!');
        loadData();
        setShowAddModal(false);
        resetForm();
      } else {
        toast.error(result.error || 'Gagal menambahkan member');
      }
    });
  };

  // Edit member
  const handleEdit = async () => {
    if (!selectedMember) return;

    startTransition(async () => {
      const result = await usersAPI.update(selectedMember.id, {
        nik: formData.nik,
        username: formData.username,
        name: formData.name,
        nickname: formData.nickname,
        email: formData.email,
        position: formData.position,
        department: formData.department,
        usernameTelegram: formData.usernameTelegram,
        phone: formData.phone,
        roleId: formData.roleId,
      });

      if (result.success) {
        toast.success('Member berhasil diubah!');
        loadData();
        setShowEditModal(false);
        setSelectedMember(null);
        resetForm();
      } else {
        toast.error(result.error || 'Gagal mengubah member');
      }
    });
  };

  // Delete member
  const handleDelete = async () => {
    if (!selectedMember) return;

    startTransition(async () => {
      const result = await usersAPI.delete(selectedMember.id);

      if (result.success) {
        toast.success('Member berhasil dihapus!');
        loadData();
        setShowDeleteModal(false);
        setSelectedMember(null);
      } else {
        toast.error(result.error || 'Gagal menghapus member');
      }
    });
  };

  const resetForm = () => {
    const memberRole = roles.find((r) => r.name === 'Member');
    setFormData({
      nik: '',
      username: '',
      password: '',
      name: '',
      nickname: '',
      email: '',
      position: 'Member',
      department: 'Data Management - TA',
      usernameTelegram: '',
      phone: '',
      roleId: memberRole?.id || '',
    });
  };

  const openEditModal = (member: User) => {
    setSelectedMember(member);
    setFormData({
      nik: member.nik,
      username: member.username,
      password: '',
      name: member.name,
      nickname: member.nickname || '',
      email: member.email,
      position: member.position,
      department: member.department,
      usernameTelegram: member.usernameTelegram || '',
      phone: member.phone || '',
      roleId: member.roleId,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (member: User) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
  };

  // Statistics
  const stats = {
    total: members.length,
    leader: members.filter((m) => m.position === 'Team Leader').length,
    member: members.filter((m) => m.position === 'Member').length,
  };

  const roleOptions = [
    { value: '', label: 'Pilih Role' },
    ...roles.map((r) => ({ value: r.id, label: r.name })),
  ];

  if (isLoading) {
    return <SkeletonPage />;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <PageHeader
        title='Kelola Tim'
        description='Kelola anggota tim Data Management'
        icon={UsersRound}
        actions={
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            disabled={isPending}
            className='flex items-center gap-2 px-4 py-2 bg-white text-[#E57373] rounded-xl font-medium hover:bg-white/90 transition-colors disabled:opacity-50'
          >
            <Plus className='w-4 h-4' />
            Tambah Member
          </button>
        }
      />

      {/* Summary Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center'>
              <Users className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Total Anggota</p>
              <p className='text-lg font-bold text-gray-800'>{stats.total}</p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center'>
              <Users className='w-5 h-5 text-purple-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Team Leader</p>
              <p className='text-lg font-bold text-purple-600'>
                {stats.leader}
              </p>
            </div>
          </div>
        </div>
        <div className='bg-white rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center'>
              <Users className='w-5 h-5 text-emerald-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Member</p>
              <p className='text-lg font-bold text-emerald-600'>
                {stats.member}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {filteredMembers.length === 0 ? (
          <div className='col-span-full text-center py-12 text-gray-500'>
            Tidak ada member ditemukan
          </div>
        ) : (
          filteredMembers.map((member) => (
            <Card key={member.id} className='relative'>
              <div className='flex items-start justify-between'>
                <div className='flex items-center gap-3'>
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className='w-12 h-12 rounded-full object-cover'
                    />
                  ) : (
                    <div className='w-12 h-12 rounded-full bg-linear-to-br from-[#E57373] to-[#C62828] flex items-center justify-center text-white font-medium'>
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <p className='font-medium text-gray-800'>{member.name}</p>
                    <p className='text-xs text-gray-500'>@{member.username}</p>
                  </div>
                </div>
                <div className='flex gap-1'>
                  <button
                    onClick={() => openEditModal(member)}
                    disabled={isPending}
                    className='p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50'
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => openDeleteModal(member)}
                    disabled={isPending}
                    className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50'
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className='mt-3 pt-3 border-t space-y-2'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-lg ${
                      member.position === 'Team Leader'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {member.position}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-lg ${
                      member.role?.color || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Shield className='w-3 h-3 inline mr-1' />
                    {member.role?.name}
                  </span>
                  <span className='text-xs text-gray-500'>
                    NIK: {member.nik}
                  </span>
                </div>

                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Phone className='w-3.5 h-3.5' />
                  <span>{member.phone || '-'}</span>
                </div>

                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Mail className='w-3.5 h-3.5' />
                  <span className='truncate'>{member.email || '-'}</span>
                </div>

                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <AtSign className='w-3.5 h-3.5' />
                  <span>{member.usernameTelegram || '-'}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={closeModal}
        size='md'
      >
        <ModalHeader
          title={showAddModal ? 'Tambah Member' : 'Edit Member'}
          subtitle='Data Management Team'
          onClose={closeModal}
        />
        <ModalBody>
          <div className='space-y-4'>
            <FormRow>
              <Input
                label='NIK'
                value={formData.nik}
                onChange={(e) =>
                  setFormData({ ...formData, nik: e.target.value })
                }
                placeholder='nik_123'
                required
              />
              <Input
                label='Username'
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder='john.doe'
                required
              />
            </FormRow>

            {showAddModal && (
              <Input
                label='Password'
                type='password'
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder='••••••••'
                required
              />
            )}

            <Input
              label='Nama Lengkap'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder='John Doe'
              required
            />

            <FormRow>
              <Input
                label='Nama Panggilan'
                value={formData.nickname}
                onChange={(e) =>
                  setFormData({ ...formData, nickname: e.target.value })
                }
                placeholder='John'
              />
              <Input
                label='Email'
                type='email'
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder='john.doe@company.com'
                required
              />
            </FormRow>

            <FormRow>
              <Select
                label='Posisi'
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                options={positionOptions}
              />
              <Select
                label='Departemen'
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                options={departmentOptions}
              />
            </FormRow>

            <Select
              label='Role'
              value={formData.roleId}
              onChange={(e) =>
                setFormData({ ...formData, roleId: e.target.value })
              }
              options={roleOptions}
            />

            <FormRow>
              <Input
                label='No. Telepon'
                type='tel'
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder='081234567890'
              />
              <Input
                label='Username Telegram'
                value={formData.usernameTelegram}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    usernameTelegram: e.target.value,
                  })
                }
                placeholder='@username'
              />
            </FormRow>
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
        isOpen={showDeleteModal && !!selectedMember}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title='Hapus Member?'
        message={`Member "${selectedMember?.name}" akan dihapus permanen dari sistem.`}
        confirmText='Hapus'
        cancelText='Batal'
        variant='danger'
      />
    </div>
  );
}
