import { createClient } from '@/utils/supabase/client';

export interface AccountInfo {
  id: string;
  bank: string;
  account_number: string;
  account_holder: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateAccountInfoInput {
  bank: string;
  account_number: string;
  account_holder: string;
}

/**
 * 계좌 정보 조회
 */
export async function getAccountInfo(): Promise<AccountInfo> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('account_info')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('계좌 정보 조회 오류:', error);
      // 기본값 반환
      return {
        id: '',
        bank: 'KB국민은행',
        account_number: '123456-78-901234',
        account_holder: '총동아리연합회',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return data as AccountInfo;
  } catch (error) {
    console.error('계좌 정보 조회 오류:', error);
    // 기본값 반환
    return {
      id: '',
      bank: 'KB국민은행',
      account_number: '123456-78-901234',
      account_holder: '총동아리연합회',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

/**
 * 계좌 정보 수정
 */
export async function updateAccountInfo(input: UpdateAccountInfoInput): Promise<AccountInfo> {
  try {
    const supabase = createClient();
    
    // 먼저 기존 데이터 조회
    const { data: existing } = await supabase
      .from('account_info')
      .select('id')
      .limit(1)
      .single();

    if (!existing) {
      // 데이터가 없으면 생성
      const { data, error } = await supabase
        .from('account_info')
        .insert({
          bank: input.bank,
          account_number: input.account_number,
          account_holder: input.account_holder,
        })
        .select()
        .single();

      if (error) {
        console.error('계좌 정보 생성 오류:', error);
        throw new Error(`계좌 정보를 생성할 수 없습니다: ${error.message}`);
      }

      return data as AccountInfo;
    } else {
      // 데이터가 있으면 수정
      const { data, error } = await supabase
        .from('account_info')
        .update({
          bank: input.bank,
          account_number: input.account_number,
          account_holder: input.account_holder,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('계좌 정보 수정 오류:', error);
        throw new Error(`계좌 정보를 수정할 수 없습니다: ${error.message}`);
      }

      return data as AccountInfo;
    }
  } catch (error) {
    console.error('계좌 정보 수정 오류:', error);
    throw error;
  }
}

