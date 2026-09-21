/*
# Fix audit_logs RLS recursion

The audit_select_own_or_admin policy has the same recursive subquery
on profiles. Replace with the is_admin() helper function.
*/

DROP POLICY IF EXISTS "audit_select_own_or_admin" ON audit_logs;

CREATE POLICY "audit_select_own_or_admin"
ON audit_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());
