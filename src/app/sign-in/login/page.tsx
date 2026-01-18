'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, LogIn, Lock, User } from 'lucide-react';
import Image from 'next/image';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authAPI.login(username, password);

      if (result.success && result.data) {
        // Store user data with login timestamp for session expiry
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...result.data,
            loginAt: Date.now(),
          }),
        );
        toast.success('Login berhasil!');
        window.location.href = '/';
      } else {
        toast.error(result.error || 'Login gagal');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors duration-300'>
      {/* Left Side - Hero/Branding */}
      <div className='hidden lg:flex lg:w-1/2 relative overflow-hidden'>
        {/* Static Gradient Background */}
        <div className='absolute inset-0 bg-gradient-to-br from-[#E57373] via-[#EF5350] to-[#C62828]' />

        {/* Floating Decorative Elements */}
        <div className='absolute top-0 left-0 w-full h-full pointer-events-none'>
          {/* Large floating circles */}
          <div
            className='absolute top-[10%] left-[10%] w-72 h-72 bg-white/10 rounded-full blur-3xl'
            style={{ animation: 'float 6s ease-in-out infinite' }}
          />
          <div
            className='absolute bottom-[10%] right-[5%] w-96 h-96 bg-white/10 rounded-full blur-3xl'
            style={{ animation: 'float 8s ease-in-out infinite reverse' }}
          />

          {/* Small floating orbs */}
          <div
            className='absolute top-[20%] right-[20%] w-16 h-16 bg-white/20 rounded-full'
            style={{ animation: 'float 4s ease-in-out infinite' }}
          />
          <div
            className='absolute top-[60%] left-[15%] w-12 h-12 bg-white/15 rounded-full'
            style={{ animation: 'float 5s ease-in-out infinite 1s' }}
          />
          <div
            className='absolute bottom-[30%] right-[30%] w-8 h-8 bg-white/25 rounded-full'
            style={{ animation: 'float 3s ease-in-out infinite 0.5s' }}
          />
          <div
            className='absolute top-[40%] left-[40%] w-6 h-6 bg-white/20 rounded-full'
            style={{ animation: 'float 4s ease-in-out infinite 2s' }}
          />

          {/* Glassmorphism accent shapes */}
          <div
            className='absolute top-[15%] right-[10%] w-32 h-32 bg-white/5 backdrop-blur-sm rounded-2xl rotate-12'
            style={{ animation: 'float 7s ease-in-out infinite' }}
          />
          <div
            className='absolute bottom-[20%] left-[8%] w-24 h-24 bg-white/5 backdrop-blur-sm rounded-xl -rotate-12'
            style={{ animation: 'float 6s ease-in-out infinite 1.5s' }}
          />
        </div>

        {/* Content */}
        <div className='relative z-10 flex flex-col justify-center items-center w-full p-12 text-white'>
          {/* Logo with glassmorphism */}
          <div className='rounded-3xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center mb-8 shadow-2xl p-6'>
            <Image
              src='/logoputih.png'
              alt='Logo'
              width={150}
              height={150}
              style={{ width: 'auto', height: 'auto' }}
              loading='eager'
            />
          </div>

          <h1 className='text-5xl font-bold mb-3 tracking-tight'>Daman</h1>
          <p className='text-xl text-white/80 mb-8 font-light'>
            Management System
          </p>

          {/* Description with glassmorphism card */}
          <div className='max-w-md text-center bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-10'>
            <p className='text-white/90 leading-relaxed'>
              Satu platform terintegrasi yang membantu pengelolaan tim secara
              lebih terstruktur, efisien, dan mudah digunakan.
            </p>
          </div>

          {/* Features with glassmorphism */}
          <div className='grid grid-cols-4 gap-4'>
            <div className='flex flex-col items-center group'>
              <div className='w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3 group-hover:bg-white/25 group-hover:scale-110 transition-all duration-300 shadow-lg'>
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
                  />
                </svg>
              </div>
              <span className='text-xs text-white/80 font-medium'>Absensi</span>
            </div>
            <div className='flex flex-col items-center group'>
              <div className='w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3 group-hover:bg-white/25 group-hover:scale-110 transition-all duration-300 shadow-lg'>
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
              </div>
              <span className='text-xs text-white/80 font-medium'>Jadwal</span>
            </div>
            <div className='flex flex-col items-center group'>
              <div className='w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3 group-hover:bg-white/25 group-hover:scale-110 transition-all duration-300 shadow-lg'>
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
                  />
                </svg>
              </div>
              <span className='text-xs text-white/80 font-medium'>Kas</span>
            </div>
            <div className='flex flex-col items-center group'>
              <div className='w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3 group-hover:bg-white/25 group-hover:scale-110 transition-all duration-300 shadow-lg'>
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
              </div>
              <span className='text-xs text-white/80 font-medium'>Report</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className='w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden'>
        {/* Subtle background gradient */}
        <div className='absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900' />

        {/* Decorative floating elements */}
        <div className='absolute top-0 left-0 w-full h-full pointer-events-none'>
          <div
            className='absolute top-[5%] right-[10%] w-32 h-32 bg-[#E57373]/10 rounded-full blur-3xl'
            style={{ animation: 'float 8s ease-in-out infinite' }}
          />
          <div
            className='absolute bottom-[10%] left-[5%] w-48 h-48 bg-[#E57373]/10 rounded-full blur-3xl'
            style={{ animation: 'float 10s ease-in-out infinite reverse' }}
          />
          <div
            className='absolute top-[40%] left-[10%] w-4 h-4 bg-[#E57373]/30 rounded-full'
            style={{ animation: 'float 4s ease-in-out infinite' }}
          />
          <div
            className='absolute bottom-[30%] right-[15%] w-3 h-3 bg-[#E57373]/20 rounded-full'
            style={{ animation: 'float 5s ease-in-out infinite 1s' }}
          />
        </div>

        <div className='w-full max-w-md relative z-10'>
          {/* Mobile Logo */}
          <div className='lg:hidden text-center mb-8'>
            <div className='inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E57373] to-[#C62828] shadow-lg shadow-red-200 mb-4 p-4'>
              <Image
                src='/logo-login.png'
                alt='Logo'
                width={55}
                height={55}
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>
            <h1 className='text-2xl font-bold text-gray-800 dark:text-white'>
              Daman
            </h1>
            <p className='text-gray-500 dark:text-gray-400'>
              Management System
            </p>
          </div>

          {/* Login Card with Glassmorphism */}
          <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-black/30 p-8 sm:p-10 border border-white/50 dark:border-gray-700/50'>
            {/* Header with icon */}
            <div className='mb-8 text-center'>
              <h2 className='text-2xl font-bold text-gray-800 dark:text-white'>
                Selamat Datang! 👋
              </h2>
              <p className='text-gray-500 dark:text-gray-400 mt-2'>
                Masuk ke akun Anda untuk melanjutkan
              </p>
            </div>

            <form onSubmit={handleSubmit} className='space-y-5'>
              {/* Username Field */}
              <div>
                <label
                  htmlFor='username'
                  className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'
                >
                  Username
                </label>
                <div className='relative group'>
                  <div className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#E57373] transition-colors'>
                    <User className='w-5 h-5' />
                  </div>
                  <input
                    type='text'
                    id='username'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder='Masukkan username'
                    className='w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50 text-gray-800 dark:text-white focus:border-[#E57373] focus:ring-4 focus:ring-[#FFCDD2]/30 dark:focus:ring-[#E57373]/20 transition-all duration-300 outline-none focus:bg-white dark:focus:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500'
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor='password'
                  className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'
                >
                  Password
                </label>
                <div className='relative group'>
                  <div className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#E57373] transition-colors'>
                    <Lock className='w-5 h-5' />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='••••••••'
                    className='w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50 text-gray-800 dark:text-white focus:border-[#E57373] focus:ring-4 focus:ring-[#FFCDD2]/30 dark:focus:ring-[#E57373]/20 transition-all duration-300 outline-none focus:bg-white dark:focus:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#E57373] transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600'
                  >
                    {showPassword ? (
                      <EyeOff className='w-5 h-5' />
                    ) : (
                      <Eye className='w-5 h-5' />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type='submit'
                disabled={isLoading}
                className='w-full py-4 px-4 bg-gradient-to-r from-[#E57373] via-[#EF5350] to-[#E57373] bg-[length:200%_100%] text-white font-semibold rounded-2xl shadow-lg shadow-red-200/50 dark:shadow-red-900/30 hover:shadow-xl hover:shadow-red-300/50 dark:hover:shadow-red-900/50 hover:-translate-y-1 hover:bg-right transition-all duration-500 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-left mt-6'
              >
                {isLoading ? (
                  <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                ) : (
                  <>
                    <LogIn className='w-5 h-5' />
                    Masuk
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className='text-center text-sm text-gray-400 dark:text-gray-500 mt-8'>
            © 2025 Daman Management System.
          </p>
        </div>
      </div>
    </div>
  );
}
