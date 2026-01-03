
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Button, ErrorMessage } from '@/components/ui';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'user'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // URL 파라미터에서 상태 확인
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'pending') {
      setError('아직 승인 대기 중입니다. 관리자 승인 후 로그인하실 수 있습니다.');
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { signInUser } = await import('@/lib/supabase/user');
      const result = await signInUser(formData.email, formData.password);

      if (!result.user) {
        throw new Error('로그인에 실패했습니다.');
      }

      // 사용자 상태 확인
      if (result.user.status === 'pending') {
        throw new Error('아직 승인 대기 중입니다. 관리자 승인 후 로그인하실 수 있습니다.');
      }

      if (result.user.status === 'rejected') {
        throw new Error('승인이 거절된 계정입니다. 관리자에게 문의해주세요.');
      }

      if (result.user.status !== 'active') {
        throw new Error('비활성화된 계정입니다. 관리자에게 문의해주세요.');
      }

      // 로그인 성공 - 세션이 쿠키에 저장될 때까지 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 디버깅: role 확인
      console.log('로그인 성공 - 사용자 role:', result.user.role);
      console.log('전체 사용자 정보:', result.user);
      
      // 전체 페이지 리로드를 통해 쿠키가 제대로 설정되도록 함
      if (result.user.role === 'admin') {
        console.log('관리자로 인식 - /admin으로 리다이렉트');
        window.location.href = '/admin';
      } else {
        console.log('일반 사용자로 인식 - /로 리다이렉트');
        window.location.href = '/';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="font-['Pacifico'] text-4xl text-blue-600 mb-2">총동연</div>
          <h2 className="text-3xl font-bold text-gray-900">로그인</h2>
          <p className="mt-2 text-sm text-gray-600">
            총동아리연합회 통합 관리 시스템
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              id="email"
              name="email"
              type="email"
              label="이메일"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="이메일을 입력하세요"
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="비밀번호"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
            />

            {error && <ErrorMessage message={error} />}

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                isLoading={isLoading}
                className="w-full"
              >
                로그인
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">데모 계정</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">관리자 계정</h4>
                <p className="text-xs text-blue-700">이메일: admin@dongari.ac.kr</p>
                <p className="text-xs text-blue-700">비밀번호: admin123</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 mb-2">회원가입 안내</h4>
                <p className="text-xs text-green-700">회원가입 후 관리자 승인을 받아야 로그인할 수 있습니다.</p>
                <p className="text-xs text-green-700">승인까지 1-2일 정도 소요됩니다.</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                계정이 없으신가요?{' '}
                <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  회원가입
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
