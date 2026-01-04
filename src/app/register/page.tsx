
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Button, ErrorMessage } from '@/components/ui';
import { formatPhoneNumber, extractNumbers, isValidPhoneNumber } from '@/utils/phone';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    clubName: '',
    phoneNumber: '',
    role: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'email') {
      if (value && !value.includes('@')) {
        setFormData(prev => ({
          ...prev,
          [name]: value + '@handong.ac.kr'
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else if (name === 'phoneNumber') {
      // 전화번호 자동 포맷팅
      const numbers = extractNumbers(value);
      // 최대 11자리까지만 입력 가능
      if (numbers.length <= 11) {
        const formatted = formatPhoneNumber(numbers);
        setFormData(prev => ({
          ...prev,
          [name]: formatted
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('이름을 입력해주세요.');
      return false;
    }
    
    if (!formData.email.endsWith('@handong.ac.kr')) {
      setError('한동대학교 이메일(@handong.ac.kr)을 사용해주세요.');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    
    if (!formData.clubName.trim()) {
      setError('동아리명을 입력해주세요.');
      return false;
    }
    
    if (!formData.phoneNumber.trim()) {
      setError('연락처를 입력해주세요.');
      return false;
    }
    
    if (!isValidPhoneNumber(formData.phoneNumber)) {
      setError('올바른 연락처 형식을 입력해주세요. (010-0000-0000)');
      return false;
    }
    
    if (!formData.role) {
      setError('역할을 선택해주세요.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const { signUpUser } = await import('@/lib/supabase/user');
      
      // 전화번호를 포맷팅하여 저장
      const formattedPhone = formatPhoneNumber(formData.phoneNumber);
      
      await signUpUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        club_name: formData.clubName,
        phone_number: formattedPhone,
        role: formData.role as 'president' | 'member',
      });
      
      setSuccess('회원가입이 완료되었습니다! 관리자 승인 후 로그인하실 수 있습니다.');
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="font-['Pacifico'] text-4xl text-blue-600 mb-2">총동연</div>
          <h2 className="text-3xl font-bold text-gray-900">회원가입</h2>
          <p className="mt-2 text-sm text-gray-600">
            총동아리연합회 통합 관리 시스템
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              id="name"
              name="name"
              type="text"
              label="이름 *"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="실명을 입력하세요"
            />

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일 <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  value={formData.email.replace('@handong.ac.kr', '')}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      email: value + '@handong.ac.kr'
                    }));
                  }}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-l-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="이메일 주소"
                />
                <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-r-md">
                  @handong.ac.kr
                </span>
              </div>
            </div>

            <Input
              id="password"
              name="password"
              type="password"
              label="비밀번호 *"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="6자 이상의 비밀번호"
            />

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="비밀번호 확인 *"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력하세요"
            />

            <Input
              id="clubName"
              name="clubName"
              type="text"
              label="동아리명 *"
              required
              value={formData.clubName}
              onChange={handleChange}
              placeholder="소속 동아리명을 입력하세요"
            />

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                역할 <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-8"
              >
                <option value="">역할을 선택하세요</option>
                <option value="president">회장</option>
                <option value="member">회원</option>
              </select>
            </div>

            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              label="연락처 *"
              required
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="010-0000-0000"
            />

            {error && <ErrorMessage message={error} />}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-check-line text-green-400"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                isLoading={isLoading}
                className="w-full"
              >
                회원가입
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                <i className="ri-information-line mr-1"></i>
                회원가입 안내
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• 한동대학교 이메일만 사용 가능합니다</li>
                <li>• 관리자 승인 후 로그인할 수 있습니다</li>
                <li>• 동아리 회장 또는 회원으로 가입 가능합니다</li>
                <li>• 승인까지 1-2일 소요될 수 있습니다</li>
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  로그인
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}