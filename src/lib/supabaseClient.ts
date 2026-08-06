import { createClient } from '@supabase/supabase-js';

// Environment variable resolution supporting both Vite and Next.js / Vercel conventions
const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://placeholder.supabase.co';

const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'organizer' | 'voter';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_verified: boolean;
  is_blocked: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizerApplication {
  id: string;
  user_id: string;
  organization_name: string;
  contact_email?: string;
  contact_phone?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
}


/**
 * Fetch full profile details for a user
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data as UserProfile;
  } catch (err) {
    console.error('Exception in getUserProfile:', err);
    return null;
  }
}

/**
 * Submit an application to become an Event Organizer
 */
export async function requestOrganizerAccess(details: {
  organizationName: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
}): Promise<{ success: boolean; error?: string; data?: OrganizerApplication }> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      return { success: false, error: 'User must be authenticated to submit organizer application.' };
    }

    const { data, error } = await supabase
      .from('organizers')
      .insert([
        {
          user_id: authData.user.id,
          organization_name: details.organizationName,
          contact_email: details.contactEmail || authData.user.email,
          contact_phone: details.contactPhone || '',
          description: details.description || '',
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as OrganizerApplication };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

/**
 * Approve an organizer application (Admin operation)
 * Updates the organizer status to 'approved' and upgrades the corresponding user profile role to 'organizer'.
 */
export async function approveOrganizer(
  organizerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Fetch organizer application details
    const { data: orgData, error: orgError } = await supabase
      .from('organizers')
      .select('id, user_id')
      .eq('id', organizerId)
      .single();

    if (orgError || !orgData) {
      return { success: false, error: orgError?.message || 'Organizer application not found.' };
    }

    // 2. Update status in organizers table
    const { error: updateOrgError } = await supabase
      .from('organizers')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', organizerId);

    if (updateOrgError) {
      return { success: false, error: updateOrgError.message };
    }

    // 3. Promote profile role to 'organizer' and set verified to true
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        role: 'organizer',
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgData.user_id);

    if (updateProfileError) {
      return { success: false, error: updateProfileError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to approve organizer.' };
  }
}

/**
 * Reject an organizer application (Admin operation)
 */
export async function rejectOrganizer(
  organizerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('organizers')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', organizerId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reject organizer.' };
  }
}
