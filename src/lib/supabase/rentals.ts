import { createClient } from '@/utils/supabase/client';
import { getCurrentUser } from './user';

export interface RentalItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: number;
  total: number;
  description: string | null;
  deposit: number;
  image: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateRentalItemInput {
  name: string;
  category: string;
  price: number;
  total: number;
  description?: string;
  deposit: number;
  image?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateRentalItemInput {
  name?: string;
  category?: string;
  price?: number;
  available?: number;
  total?: number;
  description?: string;
  deposit?: number;
  image?: string;
  status?: 'active' | 'inactive';
}

export interface RentalRequest {
  id: string;
  user_id: string;
  item_id: string;
  item_name?: string;
  quantity: number;
  rental_date: string;
  return_date: string;
  total_price: number;
  deposit: number;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  applicant: string;
  club: string | null;
  contact: string;
  purpose: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRentalRequestInput {
  item_id: string;
  quantity: number;
  rental_date: string;
  return_date: string;
  total_price: number;
  deposit: number;
  applicant: string;
  club?: string;
  contact: string;
  purpose?: string;
}

export interface UpdateRentalRequestInput {
  status?: 'pending' | 'approved' | 'rejected' | 'returned';
  admin_notes?: string | null;
  rejection_reason?: string | null;
}

/**
 * 모든 물품 조회
 */
export async function getRentalItems(includeInactive = false) {
  try {
    const supabase = createClient();
    
    let query = supabase
      .from('rental_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    if (error) {
      console.error('물품 조회 오류:', error);
      throw new Error(`물품을 가져올 수 없습니다: ${error.message}`);
    }

    return data as RentalItem[];
  } catch (error) {
    console.error('물품 조회 오류:', error);
    throw error;
  }
}

/**
 * 물품 생성
 */
export async function createRentalItem(input: CreateRentalItemInput) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('rental_items')
      .insert({
        name: input.name,
        category: input.category,
        price: input.price,
        total: input.total,
        available: input.total, // 초기 재고는 전체 수량과 동일
        description: input.description || null,
        deposit: input.deposit,
        image: input.image || null,
        status: input.status || 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('물품 생성 오류:', error);
      throw new Error(`물품을 생성할 수 없습니다: ${error.message}`);
    }

    return data as RentalItem;
  } catch (error) {
    console.error('물품 생성 오류:', error);
    throw error;
  }
}

/**
 * 물품 수정
 */
export async function updateRentalItem(id: string, input: UpdateRentalItemInput) {
  try {
    const supabase = createClient();
    
    const updateData: any = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.price !== undefined) updateData.price = input.price;
    if (input.total !== undefined) updateData.total = input.total;
    if (input.available !== undefined) updateData.available = input.available;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.deposit !== undefined) updateData.deposit = input.deposit;
    if (input.image !== undefined) updateData.image = input.image;
    if (input.status !== undefined) updateData.status = input.status;

    const { data, error } = await supabase
      .from('rental_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('물품 수정 오류:', error);
      throw new Error(`물품을 수정할 수 없습니다: ${error.message}`);
    }

    return data as RentalItem;
  } catch (error) {
    console.error('물품 수정 오류:', error);
    throw error;
  }
}

/**
 * 물품 삭제
 */
export async function deleteRentalItem(id: string) {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('rental_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('물품 삭제 오류:', error);
      throw new Error(`물품을 삭제할 수 없습니다: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('물품 삭제 오류:', error);
    throw error;
  }
}

/**
 * 모든 대여 신청 조회 (관리자용)
 */
export async function getRentalRequests(filters?: {
  status?: 'pending' | 'approved' | 'rejected';
  item_id?: string;
}) {
  try {
    const supabase = createClient();
    
    let query = supabase
      .from('rental_requests')
      .select(`
        *,
        rental_items (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.item_id) {
      query = query.eq('item_id', filters.item_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('대여 신청 조회 오류:', error);
      throw new Error(`대여 신청을 가져올 수 없습니다: ${error.message}`);
    }

    // rental_items.name을 item_name으로 변환
    return (data || []).map((r: any) => ({
      ...r,
      item_name: r.rental_items?.name || '',
    })) as RentalRequest[];
  } catch (error) {
    console.error('대여 신청 조회 오류:', error);
    throw error;
  }
}

/**
 * 내 대여 신청 조회 (사용자용)
 */
export async function getMyRentalRequests() {
  try {
    const supabase = createClient();
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    const { data, error } = await supabase
      .from('rental_requests')
      .select(`
        *,
        rental_items (
          name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('대여 신청 조회 오류:', error);
      throw new Error(`대여 신청을 가져올 수 없습니다: ${error.message}`);
    }

    // rental_items.name을 item_name으로 변환
    return (data || []).map((r: any) => ({
      ...r,
      item_name: r.rental_items?.name || '',
    })) as RentalRequest[];
  } catch (error) {
    console.error('대여 신청 조회 오류:', error);
    throw error;
  }
}

/**
 * 대여 신청 생성
 */
export async function createRentalRequest(input: CreateRentalRequestInput) {
  try {
    const supabase = createClient();
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    // 재고 확인
    const { data: item } = await supabase
      .from('rental_items')
      .select('available')
      .eq('id', input.item_id)
      .single();

    if (!item || item.available < input.quantity) {
      throw new Error('재고가 부족합니다.');
    }

    const { data, error } = await supabase
      .from('rental_requests')
      .insert({
        user_id: user.id,
        item_id: input.item_id,
        quantity: input.quantity,
        rental_date: input.rental_date,
        return_date: input.return_date,
        total_price: input.total_price,
        deposit: input.deposit,
        applicant: input.applicant,
        club: input.club || null,
        contact: input.contact,
        purpose: input.purpose || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('대여 신청 생성 오류:', error);
      throw new Error(`대여 신청을 생성할 수 없습니다: ${error.message}`);
    }

    return data as RentalRequest;
  } catch (error) {
    console.error('대여 신청 생성 오류:', error);
    throw error;
  }
}

/**
 * 대여 신청 수정 (승인/거절)
 */
export async function updateRentalRequest(id: string, input: UpdateRentalRequestInput) {
  try {
    const supabase = createClient();
    
    const updateData: any = {
      processed_at: new Date().toISOString(),
    };
    
    if (input.status !== undefined) updateData.status = input.status;
    if (input.admin_notes !== undefined) updateData.admin_notes = input.admin_notes;
    if (input.rejection_reason !== undefined) updateData.rejection_reason = input.rejection_reason;

    // 현재 상태 확인 (재고 복구를 위해)
    const { data: currentRequest } = await supabase
      .from('rental_requests')
      .select('item_id, quantity, status')
      .eq('id', id)
      .single();

    // 승인 시 재고 차감
    if (input.status === 'approved' && currentRequest?.status !== 'approved') {
      if (currentRequest) {
        const { error: rpcError } = await supabase.rpc('decrement_rental_item_available', {
          item_id: currentRequest.item_id,
          quantity: currentRequest.quantity,
        });

        if (rpcError) {
          console.error('재고 차감 오류:', rpcError);
          // 재고 차감 실패해도 계속 진행 (이미 승인 상태로 변경됨)
        }
      }
    }

    // 반납 완료 시 재고 복구
    if (input.status === 'returned' && currentRequest?.status === 'approved') {
      if (currentRequest) {
        const { error: rpcError } = await supabase.rpc('increment_rental_item_available', {
          item_id: currentRequest.item_id,
          quantity: currentRequest.quantity,
        });

        if (rpcError) {
          console.error('재고 복구 오류:', rpcError);
          // 재고 복구 실패해도 계속 진행
        }
      }
    }

    const { data, error } = await supabase
      .from('rental_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('대여 신청 수정 오류:', error);
      throw new Error(`대여 신청을 수정할 수 없습니다: ${error.message}`);
    }

    return data as RentalRequest;
  } catch (error) {
    console.error('대여 신청 수정 오류:', error);
    throw error;
  }
}

/**
 * 대여 신청 삭제
 */
export async function deleteRentalRequest(id: string) {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('rental_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('대여 신청 삭제 오류:', error);
      throw new Error(`대여 신청을 삭제할 수 없습니다: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('대여 신청 삭제 오류:', error);
    throw error;
  }
}

