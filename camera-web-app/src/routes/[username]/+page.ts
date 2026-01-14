import { USERS } from '$lib/config';

export const ssr = false;
export const csr = true;
export const prerender = true;

// Generate pages for all users
export function entries() {
  return USERS.filter(user => !user.isAdmin).map(user => ({
    username: user.username
  }));
}