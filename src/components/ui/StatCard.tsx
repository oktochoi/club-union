'use client';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  gradient?: string;
  className?: string;
}

export default function StatCard({
  icon,
  label,
  value,
  gradient = 'from-blue-500 to-blue-600',
  className = ''
}: StatCardProps) {
  return (
    <div className={`bg-gradient-to-r ${gradient} rounded-lg p-6 text-white ${className}`}>
      <div className="flex items-center">
        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
          <i className={`${icon} text-2xl`}></i>
        </div>
        <div className="ml-4">
          <p className="text-blue-100 text-sm">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

