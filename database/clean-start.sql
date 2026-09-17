-- Run this once in Supabase SQL Editor for a new empty catalogue.
-- It removes products only; users, repairs, reviews, and messages remain untouched.
DELETE FROM public.products;

-- Confirm that the public catalogue is empty.
SELECT COUNT(*) AS remaining_products FROM public.products;
