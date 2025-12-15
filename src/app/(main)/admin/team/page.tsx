'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Phone,
  Mail,
  AtSign,
  UsersRound,
} from 'lucide-react';
import { teamMembers, TeamMember } from '@/data/dummy';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ConfirmModal,
} from '@/components/ui/Modal';
import { Input, Select, FormRow } from '@/components/ui/Form';
import toast from 'react-hot-toast';

type MemberForm = {
  nik: string;
  username: string;
  name: string;
  nickname: string;
  email: string;
  position: string;
  department: string;
  usernameTelegram: string;
  phone: string;
};

const positionOptions = [
  { value: 'Team Leader', label: 'Team Leader' },
  { value: 'Member', label: 'Member' },
];

const departmentOptions = [
  { value: 'Data Management', label: 'Data Management' },
  { value: 'IT Support', label: 'IT Support' },
  { value: 'Operations', label: 'Operations' },
];

export default function AdminTeamPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState<string>('all');

  // Local members state
  const [members, setMembers] = useState<TeamMember[]>(teamMembers);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Form state
  const [formData, setFormData] = useState<MemberForm>({
    nik: '',
    username: '',
    name: '',
    nickname: '',
    email: '',
    position: 'Member',
    department: 'Data Management',
    usernameTelegram: '',
    phone: '',
  });

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
  const handleAdd = () => {
    if (!formData.name || !formData.username || !formData.nik) {
      toast.error('NIK, Username, dan Nama harus diisi!');
      return;
    }

    // Check for duplicate username
    if (members.some((m) => m.username === formData.username)) {
      toast.error('Username sudah digunakan!');
      return;
    }

    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      nik: formData.nik,
      username: formData.username,
      name: formData.name,
      nickname: formData.nickname || formData.name.split(' ')[0],
      email: formData.email,
      position: formData.position,
      department: formData.department,
      image: '',
      usernameTelegram: formData.usernameTelegram,
      phone: formData.phone,
    };

    setMembers([...members, newMember]);
    setShowAddModal(false);
    resetForm();
    toast.success('Member berhasil ditambahkan!');
  };

  // Edit member
  const handleEdit = () => {
    if (!selectedMember) return;

    setMembers(
      members.map((m) =>
        m.id === selectedMember.id
          ? {
              ...m,
              nik: formData.nik,
              username: formData.username,
              name: formData.name,
              nickname: formData.nickname,
              email: formData.email,
              position: formData.position,
              department: formData.department,
              usernameTelegram: formData.usernameTelegram,
              phone: formData.phone,
            }
          : m
      )
    );
    setShowEditModal(false);
    setSelectedMember(null);
    resetForm();
    toast.success('Member berhasil diubah!');
  };

  // Delete member
  const handleDelete = () => {
    if (!selectedMember) return;
    setMembers(members.filter((m) => m.id !== selectedMember.id));
    setShowDeleteModal(false);
    setSelectedMember(null);
    toast.success('Member berhasil dihapus!');
  };

  const resetForm = () => {
    setFormData({
      nik: '',
      username: '',
      name: '',
      nickname: '',
      email: '',
      position: 'Member',
      department: 'Data Management',
      usernameTelegram: '',
      phone: '',
    });
  };

  const openEditModal = (member: TeamMember) => {
    setSelectedMember(member);
    setFormData({
      nik: member.nik,
      username: member.username,
      name: member.name,
      nickname: member.nickname,
      email: member.email,
      position: member.position,
      department: member.department,
      usernameTelegram: member.usernameTelegram,
      phone: member.phone,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (member: TeamMember) => {
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
            className='flex items-center gap-2 px-4 py-2 bg-white text-[#E57373] rounded-xl font-medium hover:bg-white/90 transition-colors'
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

      {/* Search & Filter */}
      <div className='flex flex-col sm:flex-row gap-3'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
          <input
            type='text'
            placeholder='Cari nama, NIK, atau username...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
          />
        </div>
        <select
          value={filterPosition}
          onChange={(e) => setFilterPosition(e.target.value)}
          className='px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
        >
          <option value='all'>Semua Posisi</option>
          <option value='Team Leader'>Team Leader</option>
          <option value='Member'>Member</option>
        </select>
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
                  <div className='w-12 h-12 rounded-full bg-gradient-to-br from-[#E57373] to-[#C62828] flex items-center justify-center text-white font-medium'>
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className='font-medium text-gray-800'>{member.name}</p>
                    <p className='text-xs text-gray-500'>@{member.username}</p>
                  </div>
                </div>
                <div className='flex gap-1'>
                  <button
                    onClick={() => openEditModal(member)}
                    className='p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => openDeleteModal(member)}
                    className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className='mt-3 pt-3 border-t space-y-2'>
                <div className='flex items-center gap-2'>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-lg ${
                      member.position === 'Team Leader'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {member.position}
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

            <Input
              label='Nama Lengkap'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder='John Doe'
              required
            />

            <Input
              label='Nama Panggilan'
              value={formData.nickname}
              onChange={(e) =>
                setFormData({ ...formData, nickname: e.target.value })
              }
              placeholder='John'
            />

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

            <Input
              label='Email'
              type='email'
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder='john.doe@company.com'
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
          >
            {showAddModal ? 'Tambah' : 'Simpan'}
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
