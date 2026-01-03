'use client';

import { ReactNode } from 'react';

interface TabsProps {
  children: ReactNode;
  className?: string;
}

export default function Tabs({ children, className = '' }: TabsProps) {
  return (
    <div className={`flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit ${className}`}>
      {children}
    </div>
  );
}

interface TabProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function Tab({ active, onClick, children, className = '' }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-white text-blue-600 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      } ${className}`}
    >
      {children}
    </button>
  );
}

