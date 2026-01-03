import { createClient } from '@/utils/supabase/client';
import { getCurrentUser } from './user';

export interface Reservation {
  id: string;
  user_id: string;
  facility_id: string;
  facility_name: string;
  date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  participants: number;
  contact: string;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  rejection_reason: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReservationInput {
  facility_id: string;
  facility_name: string;
  date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  participants: number;
  contact: string;
  notes?: string;
}

export interface UpdateReservationInput {
  status?: 'pending' | 'approved' | 'rejected';
  admin_notes?: string | null;
  rejection_reason?: string | null;
}

/**
 * 모든 예약 조회 (관리자용)
 */
export async function getReservations(filters?: {
  status?: 'pending' | 'approved' | 'rejected';
  facility_id?: string;
  date?: string;
}) {
  try {
    const supabase = createClient();
    
    let query = supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.facility_id) {
      query = query.eq('facility_id', filters.facility_id);
    }
    if (filters?.date) {
      query = query.eq('date', filters.date);
    }

    const { data, error } = await query;

    if (error) {
      console.error('예약 조회 오류:', error);
      throw new Error(`예약을 가져올 수 없습니다: ${error.message}`);
    }

    return data as Reservation[];
  } catch (error) {
    console.error('예약 조회 오류:', error);
    throw error;
  }
}

/**
 * 내 예약 조회 (사용자용)
 */
export async function getMyReservations() {
  try {
    const supabase = createClient();
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('예약 조회 오류:', error);
      throw new Error(`예약을 가져올 수 없습니다: ${error.message}`);
    }

    return data as Reservation[];
  } catch (error) {
    console.error('예약 조회 오류:', error);
    throw error;
  }
}

/**
 * 특정 시설, 날짜, 시간대의 예약 확인
 */
export async function checkReservationConflict(
  facility_id: string,
  date: string,
  start_time: string,
  end_time: string,
  exclude_id?: string
) {
  try {
    const supabase = createClient();
    
    let query = supabase
      .from('reservations')
      .select('*')
      .eq('facility_id', facility_id)
      .eq('date', date)
      .eq('status', 'approved'); // 승인된 예약만 확인

    if (exclude_id) {
      query = query.neq('id', exclude_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('예약 충돌 확인 오류:', error);
      return false; // 오류 시 안전하게 false 반환
    }

    if (!data || data.length === 0) {
      return false; // 충돌 없음
    }

    // 시간대 겹침 확인
    const requestedStart = start_time;
    const requestedEnd = end_time;

    for (const reservation of data) {
      const existingStart = reservation.start_time;
      const existingEnd = reservation.end_time;

      // 시간대가 겹치는지 확인
      if (
        (requestedStart >= existingStart && requestedStart < existingEnd) ||
        (requestedEnd > existingStart && requestedEnd <= existingEnd) ||
        (requestedStart <= existingStart && requestedEnd >= existingEnd)
      ) {
        return true; // 충돌 있음
      }
    }

    return false; // 충돌 없음
  } catch (error) {
    console.error('예약 충돌 확인 오류:', error);
    return false;
  }
}

/**
 * 예약 생성
 */
export async function createReservation(input: CreateReservationInput) {
  try {
    const supabase = createClient();
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    // 예약 충돌 확인
    const hasConflict = await checkReservationConflict(
      input.facility_id,
      input.date,
      input.start_time,
      input.end_time
    );

    if (hasConflict) {
      throw new Error('해당 시간대에 이미 승인된 예약이 있습니다.');
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        user_id: user.id,
        facility_id: input.facility_id,
        facility_name: input.facility_name,
        date: input.date,
        start_time: input.start_time,
        end_time: input.end_time,
        purpose: input.purpose,
        participants: input.participants,
        contact: input.contact,
        notes: input.notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('예약 생성 오류:', error);
      throw new Error(`예약을 생성할 수 없습니다: ${error.message}`);
    }

    return data as Reservation;
  } catch (error) {
    console.error('예약 생성 오류:', error);
    throw error;
  }
}

/**
 * 예약 수정 (승인/거절)
 */
export async function updateReservation(id: string, input: UpdateReservationInput) {
  try {
    const supabase = createClient();
    
    const updateData: any = {
      processed_at: new Date().toISOString(),
    };
    
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.admin_notes !== undefined) {
      updateData.admin_notes = input.admin_notes;
    }
    if (input.rejection_reason !== undefined) {
      updateData.rejection_reason = input.rejection_reason;
    }

    // 승인 시 충돌 확인
    if (input.status === 'approved') {
      const { data: reservation } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', id)
        .single();

      if (reservation) {
        const hasConflict = await checkReservationConflict(
          reservation.facility_id,
          reservation.date,
          reservation.start_time,
          reservation.end_time,
          id
        );

        if (hasConflict) {
          throw new Error('해당 시간대에 이미 승인된 예약이 있어 승인할 수 없습니다.');
        }
      }
    }

    const { data, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('예약 수정 오류:', error);
      throw new Error(`예약을 수정할 수 없습니다: ${error.message}`);
    }

    return data as Reservation;
  } catch (error) {
    console.error('예약 수정 오류:', error);
    throw error;
  }
}

/**
 * 예약 삭제
 */
export async function deleteReservation(id: string) {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('예약 삭제 오류:', error);
      throw new Error(`예약을 삭제할 수 없습니다: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('예약 삭제 오류:', error);
    throw error;
  }
}

/**
 * 특정 시설, 날짜의 예약 목록 조회
 */
export async function getReservationsByFacilityAndDate(
  facility_id: string,
  date: string
) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('facility_id', facility_id)
      .eq('date', date)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('예약 조회 오류:', error);
      throw new Error(`예약을 가져올 수 없습니다: ${error.message}`);
    }

    return data as Reservation[];
  } catch (error) {
    console.error('예약 조회 오류:', error);
    throw error;
  }
}

