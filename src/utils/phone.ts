/**
 * 전화번호 포맷팅 유틸리티
 * 01012341234 -> 010-1234-1234
 */

/**
 * 숫자만 추출
 */
export function extractNumbers(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * 전화번호를 010-1234-1234 형식으로 포맷팅
 * @param phone 전화번호 (하이픈 포함/미포함 모두 가능)
 * @returns 포맷팅된 전화번호 (010-1234-1234)
 */
export function formatPhoneNumber(phone: string): string {
  // 숫자만 추출
  const numbers = extractNumbers(phone);
  
  // 11자리 숫자인지 확인 (010-1234-1234)
  if (numbers.length === 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }
  
  // 10자리 숫자인 경우 (010-123-4567)
  if (numbers.length === 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  }
  
  // 그 외의 경우 원본 반환
  return phone;
}

/**
 * 전화번호 유효성 검사
 * @param phone 전화번호
 * @returns 유효한 전화번호인지 여부
 */
export function isValidPhoneNumber(phone: string): boolean {
  const numbers = extractNumbers(phone);
  // 010으로 시작하는 11자리 또는 10자리 숫자
  return /^010\d{7,8}$/.test(numbers);
}

