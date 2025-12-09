'use client';

import { useState } from 'react';
import { Users, Eye, EyeOff, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    window.location.href = '/';
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF0F0] via-white to-[#FFCDD2] p-4'>
      <div className='w-full max-w-md'>
        {/* Logo */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E57373] to-[#C62828] shadow-lg shadow-red-200 mb-4'>
            <Users className='w-8 h-8 text-white' />
          </div>
          <h1 className='text-2xl font-bold text-gray-800'>Tim Kantor</h1>
          <p className='text-gray-500'>Management System</p>
        </div>

        {/* Login Card */}
        <div className='bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8'>
          <div className='text-center mb-6'>
            <h2 className='text-xl font-semibold text-gray-800'>
              Selamat Datang!
            </h2>
            <p className='text-sm text-gray-500 mt-1'>
              Silakan masuk ke akun Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-5'>
            {/* Email Field */}
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Email
              </label>
              <input
                type='email'
                id='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='nama@perusahaan.com'
                className='w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#E57373] focus:ring-2 focus:ring-[#FFCDD2] transition-all duration-200 outline-none'
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Password
              </label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='••••••••'
                  className='w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#E57373] focus:ring-2 focus:ring-[#FFCDD2] transition-all duration-200 outline-none pr-12'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
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
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className='w-4 h-4 rounded border-gray-300 text-[#E57373] focus:ring-[#E57373]'
                />
                <span className='text-sm text-gray-600'>Ingat saya</span>
              </label>
              <a
                href='#'
                className='text-sm text-[#E57373] hover:text-[#C62828] font-medium'
              >
                Lupa password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              className='w-full py-3 px-4 bg-gradient-to-r from-[#E57373] to-[#EF5350] text-white font-semibold rounded-xl shadow-lg shadow-red-200 hover:from-[#EF5350] hover:to-[#E57373] transition-all duration-200 flex items-center justify-center gap-2'
            >
              <LogIn className='w-5 h-5' />
              Masuk
            </button>
          </form>

          {/* Divider */}
          <div className='relative my-6'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-200'></div>
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-4 bg-white text-gray-500'>atau</span>
            </div>
          </div>

          {/* Demo Login */}
          <Link
            href='/'
            className='w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2'
          >
            Masuk sebagai Demo
          </Link>
        </div>

        {/* Footer */}
        <p className='text-center text-sm text-gray-500 mt-6'>
          © 2024 Tim Kantor. Semua hak dilindungi.
        </p>
      </div>
    </div>
  );
}
