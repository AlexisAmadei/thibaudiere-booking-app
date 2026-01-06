import { supabase } from './client';

export async function checkIfDisplayNameExists(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return !!data?.display_name;

  } catch (error) {
    console.error("Error checking display name:", error);
  }
}

export async function getCurrentUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No authenticated user found.");
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching current user profile:", error);
  }
}

export async function editDisplayName(displayName: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: displayName
      }
    })

    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user?.id as string);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
  }
}

export async function getProfileWithId(userId: any) {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
}