'use server';

import { redirect } from 'next/navigation';
import { checkPassword, createSession } from '@/lib/auth';

export async function login(formData) {
  const password = formData.get('password');
  if (!checkPassword(typeof password === 'string' ? password : '')) {
    await new Promise((resolve) => setTimeout(resolve, 800)); // slow down guessing
    redirect('/login?error=1');
  }
  await createSession();
  redirect('/admin');
}
