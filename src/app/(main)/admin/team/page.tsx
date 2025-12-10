'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Users,
  Phone,
  Mail,
  AtSign,
} from 'lucide-react';
import { teamMembers, TeamMember } from '@/data/dummy';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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

const positionOptions = ['Team Leader', 'Member'];
const departmentOptions = ['Data Management', 'IT Support', 'Operations'];

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

  // Statistics
  const stats = {
    total: members.length,
    leader: members.filter((m) => m.position === 'Team Leader').length,
    member: members.filter((m) => m.position === 'Member').length,
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Kelola Tim</h1>
          <p className='text-gray-500 text-sm mt-1'>
            Kelola anggota tim Data Management
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          icon={<Plus className='w-4 h-4' />}
        >
          Tambah Member
        </Button>
      </div>

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
          {positionOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
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
      {(showAddModal || showEditModal) && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <Card className='w-full max-w-lg mx-4 max-h-[90vh] overflow-auto'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-800'>
                {showAddModal ? 'Tambah Member' : 'Edit Member'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className='p-2 hover:bg-gray-100 rounded-lg'
              >
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>

            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    NIK *
                  </label>
                  <input
                    type='text'
                    value={formData.nik}
                    onChange={(e) =>
                      setFormData({ ...formData, nik: e.target.value })
                    }
                    placeholder='nik_123'
                    className='w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Username *
                  </label>
                  <input
                    type='text'
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder='john.doe'
                    className='w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Nama Lengkap *
                </label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder='John Doe'
                  className='w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Nama Panggilan
                </label>
                <input
                  type='text'
                  value={formData.nickname}
                  onChange={(e) =>
                    setFormData({ ...formData, nickname: e.target.value })
                  }
                  placeholder='John'
                  className='w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Posisi
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    className='w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                  >
                    {positionOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Departemen
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className='w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                  >
                    {departmentOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Email
                </label>
                <input
                  type='email'
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder='john.doe@company.com'
                  className='w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    No. Telepon
                  </label>
                  <input
                    type='tel'
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder='081234567890'
                    className='w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Username Telegram
                  </label>
                  <input
                    type='text'
                    value={formData.usernameTelegram}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usernameTelegram: e.target.value,
                      })
                    }
                    placeholder='@username'
                    className='w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
                  />
                </div>
              </div>
            </div>

            <div className='mt-6 flex gap-3 justify-end'>
              <Button
                variant='secondary'
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
              >
                Batal
              </Button>
              <Button onClick={showAddModal ? handleAdd : handleEdit}>
                {showAddModal ? 'Tambah' : 'Simpan'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMember && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <Card className='w-full max-w-sm mx-4'>
            <div className='text-center'>
              <div className='w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4'>
                <Trash2 className='w-6 h-6 text-red-600' />
              </div>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                Hapus Member?
              </h3>
              <p className='text-sm text-gray-500 mb-6'>
                Member &quot;{selectedMember.name}&quot; akan dihapus permanen
                dari sistem.
              </p>
              <div className='flex gap-3 justify-center'>
                <Button
                  variant='secondary'
                  onClick={() => setShowDeleteModal(false)}
                >
                  Batal
                </Button>
                <button
                  onClick={handleDelete}
                  className='px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors'
                >
                  Hapus
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
