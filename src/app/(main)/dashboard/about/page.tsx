'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/ui/SearchBar';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { teamMembers } from '@/data/dummy';
import { Mail, Phone, Building, Calendar } from 'lucide-react';

export default function AboutPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.nip.includes(searchQuery) ||
      member.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-800'>Tentang Tim</h1>
        <p className='text-gray-500'>Daftar anggota tim kantor</p>
      </div>

      {/* Search Bar */}
      <SearchBar
        placeholder='Cari berdasarkan nama, NIP, atau jabatan...'
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {/* Team Stats */}
      <div className='flex flex-wrap gap-4 text-sm text-gray-600'>
        <span className='px-3 py-1 bg-gray-100 rounded-full'>
          Total: <strong>{teamMembers.length}</strong> anggota
        </span>
        <span className='px-3 py-1 bg-gray-100 rounded-full'>
          Manager:{' '}
          <strong>
            {teamMembers.filter((m) => m.position === 'Manager').length}
          </strong>
        </span>
        <span className='px-3 py-1 bg-gray-100 rounded-full'>
          Supervisor:{' '}
          <strong>
            {teamMembers.filter((m) => m.position === 'Supervisor').length}
          </strong>
        </span>
        <span className='px-3 py-1 bg-gray-100 rounded-full'>
          Staff:{' '}
          <strong>
            {teamMembers.filter((m) => m.position === 'Staff').length}
          </strong>
        </span>
      </div>

      {/* Member Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {filteredMembers.map((member) => (
          <Card key={member.id} hover className='text-center'>
            {/* Avatar */}
            <div className='flex justify-center mb-4'>
              <Avatar src={member.avatar} name={member.name} size='xl' />
            </div>

            {/* Info */}
            <h3 className='font-semibold text-gray-800 text-lg'>
              {member.name}
            </h3>
            <p className='text-sm text-[#E57373] font-medium'>
              {member.position}
            </p>
            <p className='text-xs text-gray-500 mt-1 font-mono'>{member.nip}</p>

            {/* Department Badge */}
            <div className='mt-3'>
              <span className='inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs'>
                <Building className='w-3 h-3' />
                {member.department}
              </span>
            </div>

            {/* Contact Info */}
            <div className='mt-4 pt-4 border-t border-gray-100 space-y-2'>
              <div className='flex items-center justify-center gap-2 text-xs text-gray-500'>
                <Mail className='w-3 h-3' />
                <span className='truncate'>{member.email}</span>
              </div>
              <div className='flex items-center justify-center gap-2 text-xs text-gray-500'>
                <Phone className='w-3 h-3' />
                <span>{member.phone}</span>
              </div>
              <div className='flex items-center justify-center gap-2 text-xs text-gray-500'>
                <Calendar className='w-3 h-3' />
                <span>
                  Bergabung{' '}
                  {new Date(member.joinDate).toLocaleDateString('id-ID', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className='text-center py-12'>
          <p className='text-gray-500'>Tidak ada anggota yang ditemukan</p>
        </div>
      )}
    </div>
  );
}
