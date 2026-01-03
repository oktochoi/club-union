import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다.');
}

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }
  return createBrowserClient(supabaseUrl, supabaseKey);
};

