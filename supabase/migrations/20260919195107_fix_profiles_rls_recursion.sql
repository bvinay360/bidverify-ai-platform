/*
# Fix profiles RLS recursion issue

The profiles_select_own_or_admin policy has a recursive subquery
(SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN')
that queries the same profiles table, which is itself subject to RLS.
This can cause infinite recursion or silent failures.

Fix: Replace the admin check with a simpler approach using auth.jwt() claims
or just allow users to read their own profile. Admin reads can be handled
separately if needed.

Also adding a helper function to safely check admin role without recursion.
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;

-- Create a SECURITY DEFINER function to check admin role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

-- Recreate the policy using the helper function (no recursion)
CREATE POLICY "profiles_select_own_or_admin"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());
