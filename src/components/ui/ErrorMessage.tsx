'use client';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export default function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="w-5 h-5 flex items-center justify-center">
          <i className="ri-error-warning-line text-red-400"></i>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-800">{message}</p>
        </div>
      </div>
    </div>
  );
}

