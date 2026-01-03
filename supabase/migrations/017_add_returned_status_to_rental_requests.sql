-- 대여 신청 테이블에 'returned' 상태 추가
ALTER TABLE public.rental_requests
  DROP CONSTRAINT IF EXISTS rental_requests_status_check;

ALTER TABLE public.rental_requests
  ADD CONSTRAINT rental_requests_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'returned'));

-- 재고 복구 함수
CREATE OR REPLACE FUNCTION increment_rental_item_available(
  item_id UUID,
  quantity INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE public.rental_items
  SET available = LEAST(total, available + quantity)
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

