'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthCheck from '@/components/AuthCheck';
import OfficeHourContent from './OfficeHourContent';

export default function OfficeHourPage() {
  return (
    <AuthCheck>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <OfficeHourContent />
        <Footer />
      </div>
    </AuthCheck>
  );
}