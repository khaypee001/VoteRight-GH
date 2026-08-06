import { supabase, UserRole } from './supabaseClient';

export interface AuthResponse {
  success: boolean;
  user?: any;
  session?: any;
  role?: UserRole;
  error?: string;
}

export interface VoterStatus {
  isVerified: boolean;
  isBlocked: boolean;
  voterIdNumber?: string;
  fullName?: string;
  email?: string;
  status: 'active' | 'pending' | 'blocked' | 'not_found';
}

/**
 * Handles new user registration with Supabase Auth and profile initialization
 */
export async function signUpUser(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResponse> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Upsert profile record into public.profiles
      const { error: profileError } = await supabase.from('profiles').upsert(
        [
          {
            id: data.user.id,
            email: cleanEmail,
            full_name: fullName,
            role: 'voter',
            is_verified: true,
            is_blocked: false,
          },
        ],
        { onConflict: 'id' }
      );

      if (profileError) {
        console.warn('Profile upsert warning:', profileError.message);
      }
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      role: 'voter',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Registration failed.' };
  }
}

/**
 * Logs in voters, organizers, or admins using Supabase Auth
 */
export async function signInUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'User account not found.' };
    }

    // Retrieve user role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_verified, is_blocked')
      .eq('id', data.user.id)
      .single();

    const role: UserRole = (profile?.role as UserRole) || 'voter';

    if (role === 'organizer' && (profile?.is_verified === false || profile?.is_blocked === true)) {
      return {
        success: false,
        error: 'Organizer account is pending administrator approval or disabled.',
      };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      role,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Authentication failed.' };
  }
}

/**
 * Checks whether the logged-in user is an admin, organizer, or voter
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return 'voter';
    }

    return (data.role as UserRole) || 'voter';
  } catch (err) {
    console.error('Error in getUserRole:', err);
    return 'voter';
  }
}

/**
 * Queries database records for voter verification and status
 */
export async function fetchVoterStatus(voterIdNumber: string): Promise<VoterStatus> {
  try {
    const cleanId = voterIdNumber.trim();

    // Query voters / profiles table by phone, email, or voter ID
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, email, is_verified, is_blocked')
      .or(`phone.eq.${cleanId},email.eq.${cleanId},id.eq.${cleanId}`)
      .single();

    if (error || !data) {
      return {
        isVerified: false,
        isBlocked: false,
        voterIdNumber: cleanId,
        status: 'not_found',
      };
    }

    let status: 'active' | 'pending' | 'blocked' = 'active';
    if (data.is_blocked) {
      status = 'blocked';
    } else if (!data.is_verified) {
      status = 'pending';
    }

    return {
      isVerified: data.is_verified ?? true,
      isBlocked: data.is_blocked ?? false,
      voterIdNumber: cleanId,
      fullName: data.full_name || 'Registered Voter',
      email: data.email,
      status,
    };
  } catch (err) {
    console.error('Error fetching voter status:', err);
    return {
      isVerified: false,
      isBlocked: false,
      voterIdNumber: voterIdNumber,
      status: 'not_found',
    };
  }
}
