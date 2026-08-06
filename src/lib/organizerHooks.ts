import { supabase } from './supabaseClient';
import { Contest, Nominee, PayoutRequest, VoteTransaction } from '../types';

export interface CreateEventInput {
  title: string;
  type: 'voting' | 'ticketing' | 'hybrid';
  description: string;
  bannerUrl: string;
  votePrice: number;
  startDate: string;
  endDate: string;
  categories: {
    id: string;
    name: string;
    nominees: {
      name: string;
      code: string;
      photoUrl: string;
      bio?: string;
    }[];
  }[];
  ticketTiers: {
    name: string;
    price: number;
    description?: string;
    available: number;
  }[];
}

export interface PayoutRequestInput {
  userId: string;
  amount: number;
  momoNetwork: 'MTN MoMo' | 'Telecel Cash' | 'AT Money';
  accountNumber: string;
  accountName: string;
}

/**
 * Supabase Query Hook / Function: Fetch events belonging to current organizer
 */
export async function fetchOrganizerEvents(userId: string): Promise<{ data: Contest[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .or(`organizer_id.eq.${userId},organizer.ilike.%${userId}%`);

    if (error) {
      console.warn('Supabase fetch error for organizer events, falling back:', error.message);
      return { data: [] };
    }

    return { data: data || [] };
  } catch (err: any) {
    return { data: [], error: err.message };
  }
}

/**
 * Supabase Query Hook / Function: Fetch votes / voter logs for organizer events
 */
export async function fetchOrganizerVoterLogs(contestId: string): Promise<{ data: VoteTransaction[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('vote_transactions')
      .select('*')
      .eq('contest_id', contestId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error for voter logs:', error.message);
      return { data: [] };
    }

    return { data: data || [] };
  } catch (err: any) {
    return { data: [], error: err.message };
  }
}

/**
 * Supabase Hook / Function: Insert new Event / Contest into Supabase
 */
export async function createOrganizerEvent(
  userId: string,
  eventData: CreateEventInput
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const contestId = `contest-${Date.now()}`;
    const categoryNames = eventData.categories.map((c) => c.name);

    // Insert into 'contests' table
    const { error: contestError } = await supabase.from('contests').insert([
      {
        id: contestId,
        organizer_id: userId,
        title: eventData.title,
        description: eventData.description,
        banner_url: eventData.bannerUrl,
        category: eventData.type,
        vote_price: eventData.votePrice,
        start_date: eventData.startDate,
        end_date: eventData.endDate,
        is_live: true,
        categories: categoryNames,
        tickets_enabled: eventData.ticketTiers.length > 0,
        ticket_tiers: eventData.ticketTiers,
      },
    ]);

    if (contestError) {
      console.warn('Supabase insert contest warning:', contestError.message);
    }

    // Insert nominees into 'nominees' table
    const nomineesToInsert = eventData.categories.flatMap((cat) =>
      cat.nominees.map((nom, idx) => ({
        id: `nom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        contest_id: contestId,
        category: cat.name,
        name: nom.name,
        code: nom.code,
        photo_url: nom.photoUrl,
        bio: nom.bio || '',
        votes: 0,
        status: 'approved',
      }))
    );

    if (nomineesToInsert.length > 0) {
      const { error: nomineeError } = await supabase.from('nominees').insert(nomineesToInsert);
      if (nomineeError) {
        console.warn('Supabase insert nominees warning:', nomineeError.message);
      }
    }

    return { success: true, eventId: contestId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create event.' };
  }
}

/**
 * Supabase Hook / Function: Insert Mobile Money Payout Request
 */
export async function insertPayoutRequest(
  payout: PayoutRequestInput
): Promise<{ success: boolean; payoutId?: string; error?: string }> {
  try {
    const payoutId = `payout-${Date.now()}`;

    const { data, error } = await supabase.from('payout_requests').insert([
      {
        id: payoutId,
        user_id: payout.userId,
        amount: payout.amount,
        momo_network: payout.momoNetwork,
        account_number: payout.accountNumber,
        account_name: payout.accountName,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.warn('Supabase insert payout request warning:', error.message);
    }

    return { success: true, payoutId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit payout request.' };
  }
}

/**
 * Supabase Hook / Function: Fetch Payout Requests History for User
 */
export async function fetchPayoutRequests(userId: string): Promise<{ data: PayoutRequest[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch payout requests warning:', error.message);
      return { data: [] };
    }

    const formatted: PayoutRequest[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      momoNetwork: row.momo_network,
      accountNumber: row.account_number,
      accountName: row.account_name,
      status: row.status || 'PENDING',
      createdAt: row.created_at || new Date().toISOString(),
    }));

    return { data: formatted };
  } catch (err: any) {
    return { data: [], error: err.message };
  }
}
