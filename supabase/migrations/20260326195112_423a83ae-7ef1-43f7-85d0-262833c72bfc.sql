INSERT INTO public.user_roles (user_id, role)
VALUES ('1230b709-8e8a-41fd-a163-2f2b022bbbf8', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;