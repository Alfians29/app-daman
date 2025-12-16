'use client';

import { useState, useEffect } from 'react';
import { Users, Eye, EyeOff, LogIn, Lock, User, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(result.data));
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
      <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#E57373] via-[#EF5350] to-[#C62828] relative overflow-hidden'>
        {/* Decorative Elements */}
        <div className='absolute top-0 left-0 w-full h-full'>
          <div className='absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl' />
          <div className='absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl' />
          <div className='absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full' />
        </div>

        {/* Content */}
        <div className='relative z-10 flex flex-col justify-center items-center w-full p-12 text-white'>
          <div className='w-50 h-35 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8 shadow-2xl'>
            {/* <Users className='w-12 h-12' /> */}
            <Image src='/logoputih.png' alt='Logo' width={150} height={150} />
          </div>
          <h1 className='text-4xl font-bold mb-4'>Daman</h1>
          <p className='text-xl text-white/80 mb-8'>Management System</p>

          <div className='max-w-sm text-center'>
            <p className='text-white/70 leading-relaxed'>
              Kelola tim Anda dengan mudah. Absensi, jadwal, dan kas tim dalam
              satu platform terintegrasi.
            </p>
          </div>

          {/* Features */}
          <div className='mt-12 grid grid-cols-3 gap-6 text-center'>
            <div className='flex flex-col items-center'>
              <div className='w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-2'>
                <Sparkles className='w-6 h-6' />
              </div>
              <span className='text-sm text-white/70'>Absensi</span>
            </div>
            <div className='flex flex-col items-center'>
              <div className='w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-2'>
                <Sparkles className='w-6 h-6' />
              </div>
              <span className='text-sm text-white/70'>Jadwal</span>
            </div>
            <div className='flex flex-col items-center'>
              <div className='w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-2'>
                <Sparkles className='w-6 h-6' />
              </div>
              <span className='text-sm text-white/70'>Kas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className='w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12'>
        <div className='w-full max-w-md'>
          {/* Mobile Logo */}
          <div className='lg:hidden text-center mb-8'>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E57373] to-[#C62828] shadow-lg mb-4'>
              <Image src='/logoputih.png' alt='Logo' width={55} height={55} />
            </div>
            <h1 className='text-2xl font-bold text-gray-800 dark:text-white'>
              Daman
            </h1>
            <p className='text-gray-500 dark:text-gray-400'>
              Management System
            </p>
          </div>

          {/* Login Card */}
          <div className='bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 p-8 sm:p-10 transition-colors duration-300'>
            <div className='mb-8'>
              <h2 className='text-2xl font-bold text-gray-800 dark:text-white'>
                Selamat Datang! 👋
              </h2>
              <p className='text-gray-500 dark:text-gray-400 mt-2'>
                Masuk ke akun Anda untuk melanjutkan
              </p>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Username Field */}
              <div>
                <label
                  htmlFor='username'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                >
                  Username
                </label>
                <div className='relative'>
                  <div className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'>
                    <User className='w-5 h-5' />
                  </div>
                  <input
                    type='text'
                    id='username'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder='Masukkan username'
                    className='w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-[#E57373] focus:ring-4 focus:ring-[#FFCDD2]/50 dark:focus:ring-[#E57373]/30 transition-all duration-200 outline-none focus:bg-white dark:focus:bg-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500'
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor='password'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                >
                  Password
                </label>
                <div className='relative'>
                  <div className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'>
                    <Lock className='w-5 h-5' />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='••••••••'
                    className='w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-[#E57373] focus:ring-4 focus:ring-[#FFCDD2]/50 dark:focus:ring-[#E57373]/30 transition-all duration-200 outline-none focus:bg-white dark:focus:bg-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
                  >
                    {showPassword ? (
                      <EyeOff className='w-5 h-5' />
                    ) : (
                      <Eye className='w-5 h-5' />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className='flex items-center justify-between'>
                <label className='flex items-center gap-2 cursor-pointer group'>
                  <input
                    type='checkbox'
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className='w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#E57373] focus:ring-[#E57373] bg-white dark:bg-gray-700'
                  />
                  <span className='text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors'>
                    Ingat saya
                  </span>
                </label>
                <a
                  href='#'
                  className='text-sm text-[#E57373] hover:text-[#C62828] font-medium transition-colors'
                >
                  Lupa password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type='submit'
                disabled={isLoading}
                className='w-full py-4 px-4 bg-gradient-to-r from-[#E57373] to-[#EF5350] text-white font-semibold rounded-xl shadow-lg shadow-red-200 dark:shadow-red-900/30 hover:shadow-xl hover:shadow-red-300 dark:hover:shadow-red-900/50 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0'
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

            {/* Divider */}
            <div className='relative my-8'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-200 dark:border-gray-600'></div>
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-4 bg-white dark:bg-gray-800 text-gray-400'>
                  atau
                </span>
              </div>
            </div>

            {/* Demo Login */}
            <Link
              href='/'
              className='w-full py-3.5 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md'
            >
              <Sparkles className='w-5 h-5 text-gray-500 dark:text-gray-400' />
              Masuk sebagai Demo
            </Link>
          </div>

          {/* Footer */}
          <p className='text-center text-sm text-gray-400 dark:text-gray-500 mt-8'>
            © 2024 Daman Management System. <br className='sm:hidden' />
            Semua hak dilindungi.
          </p>
        </div>
      </div>
    </div>
  );
}
