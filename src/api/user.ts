import { request } from './http.ts';

/**
 * The signed-in member as `/api/me` returns them. `name` is their display name. The helpers
 * below keep the Supabase-era names the components already call.
 */
export interface Member {
  id: string;
  email: string;
  name: string;
}

// These log a failure and resolve to undefined rather than reject, as they did under Supabase.

export async function checkIfDisplayNameExists() {
  try {
    const profile = await request<Member>('GET', '/me');
    return !!profile.name;
  } catch (error) {
    console.error('Error checking display name:', error);
  }
}

export async function getCurrentUserProfile() {
  try {
    return await request<Member>('GET', '/me');
  } catch (error) {
    console.error('Error fetching current user profile:', error);
  }
}

export async function editDisplayName(displayName: string) {
  try {
    await request<Member>('PATCH', '/me', { name: displayName });
  } catch (error) {
    console.error('Error updating user profile:', error);
  }
}
