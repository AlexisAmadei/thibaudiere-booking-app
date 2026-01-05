import { supabase } from './client';

export async function editDisplayName(displayName: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        display_name: displayName
      }
    })

    console.log("User profile updated:", data);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
  }
}

// export async function updateEmail(newEmail: string) {}