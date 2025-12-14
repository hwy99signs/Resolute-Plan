import { supabase } from '../lib/supabase';

export interface JournalEntry {
  id: string;
  user_id: string;
  pakt_id?: string;
  date: string;
  title?: string;
  mood?: string;
  thoughts: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryInsert {
  user_id: string;
  pakt_id?: string;
  date: string;
  title?: string;
  mood?: string;
  thoughts: string;
}

export class JournalService {
  /**
   * Create a new journal entry
   */
  static async createEntry(entry: JournalEntryInsert): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all journal entries for a user
   */
  static async getUserEntries(userId: string): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get journal entries for a specific Resolve
   */
  static async getPaktEntries(userId: string, paktId: string): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('pakt_id', paktId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single journal entry
   */
  static async getEntry(entryId: string): Promise<JournalEntry | null> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  /**
   * Update a journal entry
   */
  static async updateEntry(entryId: string, updates: Partial<JournalEntryInsert>): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a journal entry
   */
  static async deleteEntry(entryId: string): Promise<void> {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId);

    if (error) throw error;
  }

  /**
   * Get entries by date range
   */
  static async getEntriesByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
