import { createClient } from '@/utils/supabase/client';

export interface Facility {
  id: string;
  name: string;
  capacity: string;
  equipment: string | null;
  time_slots: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateFacilityInput {
  name: string;
  capacity: string;
  equipment?: string;
  time_slots: string[];
  status?: 'active' | 'inactive';
}

export interface UpdateFacilityInput {
  name?: string;
  capacity?: string;
  equipment?: string;
  time_slots?: string[];
  status?: 'active' | 'inactive';
}

/**
 * 모든 시설 조회 (활성화된 시설만)
 */
export async function getFacilities(includeInactive: boolean = false) {
  try {
    const supabase = createClient();
    
    let query = supabase
      .from('facilities')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    if (error) {
      console.error('시설 조회 오류:', error);
      throw new Error(`시설을 가져올 수 없습니다: ${error.message}`);
    }

    return data as Facility[];
  } catch (error) {
    console.error('시설 조회 오류:', error);
    throw error;
  }
}

/**
 * 시설 ID로 조회
 */
export async function getFacilityById(id: string) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('시설 조회 오류:', error);
      throw new Error(`시설을 가져올 수 없습니다: ${error.message}`);
    }

    return data as Facility;
  } catch (error) {
    console.error('시설 조회 오류:', error);
    throw error;
  }
}

/**
 * 시설 생성
 */
export async function createFacility(input: CreateFacilityInput) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('facilities')
      .insert({
        name: input.name,
        capacity: input.capacity,
        equipment: input.equipment || null,
        time_slots: input.time_slots,
        status: input.status || 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('시설 생성 오류:', error);
      throw new Error(`시설을 생성할 수 없습니다: ${error.message}`);
    }

    return data as Facility;
  } catch (error) {
    console.error('시설 생성 오류:', error);
    throw error;
  }
}

/**
 * 시설 수정
 */
export async function updateFacility(id: string, input: UpdateFacilityInput) {
  try {
    const supabase = createClient();
    
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.capacity !== undefined) updateData.capacity = input.capacity;
    if (input.equipment !== undefined) updateData.equipment = input.equipment || null;
    if (input.time_slots !== undefined) updateData.time_slots = input.time_slots;
    if (input.status !== undefined) updateData.status = input.status;

    const { data, error } = await supabase
      .from('facilities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('시설 수정 오류:', error);
      throw new Error(`시설을 수정할 수 없습니다: ${error.message}`);
    }

    return data as Facility;
  } catch (error) {
    console.error('시설 수정 오류:', error);
    throw error;
  }
}

/**
 * 시설 삭제
 */
export async function deleteFacility(id: string) {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('facilities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('시설 삭제 오류:', error);
      throw new Error(`시설을 삭제할 수 없습니다: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('시설 삭제 오류:', error);
    throw error;
  }
}

