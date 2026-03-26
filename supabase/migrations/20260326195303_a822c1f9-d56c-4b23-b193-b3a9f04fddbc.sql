
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;

-- Admins can see all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Users can see their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());

-- Also tighten contacts INSERT/UPDATE policies
DROP POLICY IF EXISTS "Authenticated can insert contacts" ON public.contacts;
CREATE POLICY "Authenticated can insert contacts"
ON public.contacts FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendente'));

DROP POLICY IF EXISTS "Authenticated can update contacts" ON public.contacts;
CREATE POLICY "Authenticated can update contacts"
ON public.contacts FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendente'));

-- Tighten messages INSERT policy
DROP POLICY IF EXISTS "Authenticated can insert messages" ON public.messages;
CREATE POLICY "Authenticated can insert messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendente'));
