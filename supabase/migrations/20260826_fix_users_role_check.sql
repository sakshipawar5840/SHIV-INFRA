-- =====================================================
-- SHIVINFRA DAY 5 FIX
-- users_role_check constraint update
-- =====================================================
--
-- ROOT CAUSE:
-- The live `users.role` CHECK constraint only allows
-- lowercase `admin` and `customer`, but the application
-- and schema intend to support:
--   Super Admin, Admin, Engineer, Sales Manager, Customer
--
-- This blocks WhatsApp Engineer user resolution and
-- permission verification.
--
-- FIX:
-- Update the constraint to allow all intended role values
-- in a case-insensitive manner, preserving existing rows.
-- =====================================================

ALTER TABLE public.users
    DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
    ADD CONSTRAINT users_role_check
    CHECK (
        lower(role) IN (
            'super admin',
            'admin',
            'engineer',
            'sales manager',
            'customer'
        )
    );

-- =====================================================
-- Optional: normalize existing rows to title-case
-- (safe because application code uppercases role anyway)
-- =====================================================
UPDATE public.users
   SET role = 'Admin'
 WHERE lower(role) = 'admin'
   AND role <> 'Admin';

UPDATE public.users
   SET role = 'Customer'
 WHERE lower(role) = 'customer'
   AND role <> 'Customer';
