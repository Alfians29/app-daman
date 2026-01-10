'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, children, size = 'md' }: ModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <>
      {/* Overlay - no click to close */}
      <div className='fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-black/50 z-999' />

      {/* Modal Container */}
      <div className='fixed top-0 left-0 right-0 bottom-0 w-full h-full z-1000 flex items-center justify-center p-4'>
        <div
          className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}
        >
          {children}
        </div>
      </div>
    </>
  );
}

// ============== MODAL HEADER ==============
interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export function ModalHeader({ title, subtitle, onClose }: ModalHeaderProps) {
  return (
    <div className='flex items-center justify-between p-5 bg-linear-to-r from-[#E57373] to-[#EF5350] dark:from-[#7f1d1d] dark:to-[#991b1b]'>
      <div>
        <h3 className='text-lg font-bold text-white'>{title}</h3>
        {subtitle && <p className='text-white/80 text-sm'>{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        className='p-2 hover:bg-white/20 rounded-lg transition-colors'
      >
        <X className='w-5 h-5 text-white' />
      </button>
    </div>
  );
}

// ============== MODAL BODY ==============
interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return (
    <div className={`p-5 overflow-y-auto flex-1 ${className}`}>{children}</div>
  );
}

// ============== MODAL FOOTER ==============
interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`flex gap-3 p-5 bg-gray-50 dark:bg-gray-900 ${className}`}>
      {children}
    </div>
  );
}

// ============== CONFIRM MODAL ==============
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const variantStyles = {
    danger: {
      headerBg: 'from-red-500 to-red-600',
      confirmBtn: 'bg-red-500 hover:bg-red-600',
    },
    warning: {
      headerBg: 'from-amber-500 to-amber-600',
      confirmBtn: 'bg-amber-500 hover:bg-amber-600',
    },
    info: {
      headerBg: 'from-blue-500 to-blue-600',
      confirmBtn: 'bg-blue-500 hover:bg-blue-600',
    },
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='sm'>
      <div
        className={`flex items-center justify-between p-5 bg-linear-to-r ${variantStyles[variant].headerBg}`}
      >
        <h3 className='text-lg font-bold text-white'>{title}</h3>
        <button
          onClick={onClose}
          className='p-2 hover:bg-white/20 rounded-lg transition-colors'
        >
          <X className='w-5 h-5 text-white' />
        </button>
      </div>

      <ModalBody>
        <p className='text-gray-600 dark:text-gray-300'>{message}</p>
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          disabled={isLoading}
          className='flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-colors disabled:opacity-50'
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`flex-1 py-2.5 ${variantStyles[variant].confirmBtn} text-white font-medium rounded-xl transition-colors disabled:opacity-50`}
        >
          {isLoading ? 'Loading...' : confirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
}
