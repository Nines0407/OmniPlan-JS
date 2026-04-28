import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z.string().min(3).max(50),
  display_name: z.string().min(1).max(100),
});

export const LoginSchema = z.object({
  username: z.string().min(1),
});
