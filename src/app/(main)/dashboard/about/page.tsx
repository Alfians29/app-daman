'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Mail,
  Phone,
  Building,
  AtSign,
  Search,
  Filter,
  X,
  Users,
  Crown,
  User,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal';
import { usersAPI } from '@/lib/api';

type TeamMember = {
  id: string;
  name: string;
  nickname: string | null;
  nik: string;
  username: string;
  email: string;
  position: string;
  department: string;
  phone: string | null;
  usernameTelegram: string | null;
  image: string | null;
  isActive: boolean;
};

export default function AboutPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showOrgChart, setShowOrgChart] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setIsLoading(true);
    const result = await usersAPI.getAll();
    if (result.success && result.data) {
      setTeamMembers(result.data.filter((m: TeamMember) => m.isActive));
    }
    setIsLoading(false);
  };

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.nik.includes(searchQuery) ||
      member.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition =
      filterPosition === 'all' || member.position === filterPosition;
    return matchesSearch && matchesPosition;
  });

  const stats = {
    total: teamMembers.length,
    leader: teamMembers.filter((m) => m.position === 'Team Leader').length,
    member: teamMembers.filter((m) => m.position === 'Member').length,
  };

  const teamLeader = teamMembers.find((m) => m.position === 'Team Leader');
  const members = teamMembers.filter((m) => m.position === 'Member');

  const resetFilters = () => {
    setSearchQuery('');
    setFilterPosition('all');
  };

  const hasActiveFilters = searchQuery || filterPosition !== 'all';

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='w-8 h-8 animate-spin text-[#E57373]' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Tentang Tim'
        description={`Tim Data Management - ${stats.total} anggota`}
        icon={Users}
      />

      {/* Stats Cards */}
      <div className='grid grid-cols-3 gap-4'>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center'>
              <Users className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Total Anggota</p>
              <p className='text-2xl font-bold text-blue-600'>{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center'>
              <Crown className='w-6 h-6 text-amber-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Team Leader</p>
              <p className='text-2xl font-bold text-amber-600'>
                {stats.leader}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center'>
              <User className='w-6 h-6 text-emerald-600' />
            </div>
            <div>
              <p className='text-xs text-gray-500'>Member</p>
              <p className='text-2xl font-bold text-emerald-600'>
                {stats.member}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Organization Chart */}
      <Card>
        <div
          className='flex items-center justify-between cursor-pointer'
          onClick={() => setShowOrgChart(!showOrgChart)}
        >
          <div>
            <h3 className='font-semibold text-gray-800'>Struktur Organisasi</h3>
            <p className='text-sm text-gray-500'>Tim Data Management</p>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${
              showOrgChart ? 'rotate-180' : ''
            }`}
          />
        </div>

        {showOrgChart && (
          <div className='mt-6'>
            {teamLeader && (
              <div className='flex flex-col items-center'>
                <div
                  className='flex flex-col items-center cursor-pointer hover:opacity-80'
                  onClick={() => setSelectedMember(teamLeader)}
                >
                  <div className='relative'>
                    <Avatar
                      src={teamLeader.image}
                      name={teamLeader.name}
                      size='lg'
                    />
                    <div className='absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center'>
                      <Crown className='w-3 h-3 text-white' />
                    </div>
                  </div>
                  <p className='mt-2 font-semibold text-gray-800'>
                    {teamLeader.nickname || teamLeader.name}
                  </p>
                  <span className='text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg'>
                    Team Leader
                  </span>
                </div>
                <div className='w-px h-8 bg-gray-200 my-2' />
                <div className='w-3/4 h-px bg-gray-200' />
              </div>
            )}

            <div className='flex flex-wrap justify-center gap-4 mt-4'>
              {members.map((member) => (
                <div
                  key={member.id}
                  className='flex flex-col items-center cursor-pointer hover:opacity-80 w-20'
                  onClick={() => setSelectedMember(member)}
                >
                  <div className='w-px h-4 bg-gray-200 -mt-4 mb-2' />
                  <Avatar src={member.image} name={member.name} size='md' />
                  <p className='mt-1 text-xs font-medium text-gray-800 text-center truncate w-full'>
                    {member.nickname || member.name}
                  </p>
                  <span className='text-[10px] text-gray-500'>Member</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Search & Filter */}
      <Card>
        <div className='flex items-center gap-2 mb-4'>
          <Filter className='w-5 h-5 text-gray-400' />
          <h3 className='font-semibold text-gray-800'>Filter & Cari</h3>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className='ml-auto text-xs text-[#E57373] hover:underline flex items-center gap-1'
            >
              <X className='w-3 h-3' /> Reset
            </button>
          )}
        </div>

        <div className='flex flex-col sm:flex-row gap-3'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input
              type='text'
              placeholder='Cari nama, NIK, atau jabatan...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]'
            />
          </div>
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className='px-4 py-2 rounded-lg border border-gray-200 text-sm'
          >
            <option value='all'>Semua Posisi</option>
            <option value='Team Leader'>Team Leader</option>
            <option value='Member'>Member</option>
          </select>
        </div>
      </Card>

      {/* Member Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {filteredMembers.length === 0 ? (
          <div className='col-span-full text-center py-12 text-gray-500'>
            <Users className='w-12 h-12 mx-auto text-gray-300 mb-2' />
            <p>Tidak ada anggota ditemukan</p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <Card
              key={member.id}
              className='cursor-pointer hover:shadow-lg transition-shadow'
              onClick={() => setSelectedMember(member)}
            >
              <div className='flex items-center gap-3'>
                <div className='relative'>
                  <Avatar src={member.image} name={member.name} size='lg' />
                  {member.position === 'Team Leader' && (
                    <div className='absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center'>
                      <Crown className='w-2.5 h-2.5 text-white' />
                    </div>
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-semibold text-gray-800 truncate'>
                    {member.name}
                  </p>
                  <p className='text-xs text-gray-500'>@{member.username}</p>
                  <span
                    className={`inline-flex text-xs px-2 py-0.5 rounded-lg mt-1 ${
                      member.position === 'Team Leader'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {member.position}
                  </span>
                </div>
              </div>
              <div className='mt-3 pt-3 border-t border-gray-100 space-y-1.5'>
                <div className='flex items-center gap-2 text-xs text-gray-500'>
                  <Building className='w-3 h-3' />
                  <span>{member.department}</span>
                </div>
                <div className='flex items-center gap-2 text-xs text-gray-500'>
                  <Phone className='w-3 h-3' />
                  <span>{member.phone || '-'}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Member Detail Modal */}
      <Modal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        size='md'
      >
        <ModalHeader
          title='Detail Member'
          onClose={() => setSelectedMember(null)}
        />
        <ModalBody>
          {selectedMember && (
            <>
              <div className='text-center mb-6'>
                <div className='relative inline-block'>
                  <Avatar
                    src={selectedMember.image}
                    name={selectedMember.name}
                    size='xl'
                  />
                  {selectedMember.position === 'Team Leader' && (
                    <div className='absolute -bottom-1 -right-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center'>
                      <Crown className='w-4 h-4 text-white' />
                    </div>
                  )}
                </div>
                <h4 className='mt-3 text-xl font-bold text-gray-800'>
                  {selectedMember.name}
                </h4>
                <p className='text-gray-500'>
                  ({selectedMember.nickname || '-'})
                </p>
                <span
                  className={`inline-flex text-sm px-3 py-1 rounded-lg mt-2 ${
                    selectedMember.position === 'Team Leader'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {selectedMember.position}
                </span>
              </div>

              <div className='space-y-3'>
                <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-xl'>
                  <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                    <Building className='w-5 h-5 text-blue-600' />
                  </div>
                  <div>
                    <p className='text-xs text-gray-500'>Departemen</p>
                    <p className='font-medium text-gray-800'>
                      {selectedMember.department}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-xl'>
                  <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
                    <span className='text-xs font-bold text-purple-600'>
                      NIK
                    </span>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500'>NIK</p>
                    <p className='font-medium text-gray-800 font-mono'>
                      {selectedMember.nik}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-xl'>
                  <div className='w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center'>
                    <Mail className='w-5 h-5 text-emerald-600' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-xs text-gray-500'>Email</p>
                    <p className='font-medium text-gray-800 truncate'>
                      {selectedMember.email}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-xl'>
                  <div className='w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center'>
                    <Phone className='w-5 h-5 text-amber-600' />
                  </div>
                  <div>
                    <p className='text-xs text-gray-500'>Telepon</p>
                    <p className='font-medium text-gray-800'>
                      {selectedMember.phone || '-'}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-xl'>
                  <div className='w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center'>
                    <AtSign className='w-5 h-5 text-sky-600' />
                  </div>
                  <div>
                    <p className='text-xs text-gray-500'>Telegram</p>
                    <p className='font-medium text-gray-800'>
                      {selectedMember.usernameTelegram || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant='secondary'
            onClick={() => setSelectedMember(null)}
            className='flex-1'
          >
            Tutup
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
