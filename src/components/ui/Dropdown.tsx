'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export default function Dropdown({ trigger, children, align = 'right', className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-48 bg-white rounded-md shadow-lg border z-50`}>
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownMenuProps {
  children: ReactNode;
  className?: string;
}

export function DropdownMenu({ children, className = '' }: DropdownMenuProps) {
  return (
    <div className={`py-1 ${className}`}>
      {children}
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  variant?: 'default' | 'danger';
}

export function DropdownItem({ children, onClick, href, className = '', variant = 'default' }: DropdownItemProps) {
  const baseStyles = 'block px-4 py-2 text-sm w-full text-left';
  const variants = {
    default: 'text-gray-700 hover:bg-gray-100',
    danger: 'text-red-600 hover:bg-red-50'
  };

  if (href) {
    return (
      <a href={href} className={`${baseStyles} ${variants[variant]} ${className}`}>
        {children}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

