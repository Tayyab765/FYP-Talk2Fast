import { supabase, supabaseAdmin } from '../config/supabaseClient.js';

export const signUp = async ({ email, password, full_name }) => {
  // Supabase signUp
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name } }
  });

  if (error) throw error;

  // data.user may be null until user confirms email depending on settings
  // Create profile in profiles table if user id present
  if (data?.user?.id) {
    const { error: pErr } = await supabase
      .from('profiles')
      .upsert({ id: data.user.id, full_name, role: 'student' }, { returning: 'minimal' });

    if (pErr) throw pErr;
  }

  return data;
};

export const signIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
};

export const signOut = async ({ access_token }) => {
  // server side signOut
  // If client sends access_token we can call supabase.auth.signOut() - supabase-js will use stored session normally.
  // For robust server-side token revocation, using admin/service role to delete refresh tokens would be required.
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
};

export const getUserFromToken = async (token) => {
  if (!token) return null;
  try {
    // try client method
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
      // if anon key can't verify, try admin
      if (supabaseAdmin) {
        const { data: adminData, error: adminErr } = await supabaseAdmin.auth.getUser(token);
        if (adminErr) throw adminErr;
        return adminData.user;
      }
      throw error;
    }
    return data.user;
  } catch (err) {
    throw err;
  }
};

export const getProfileById = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
};

// Chat history helpers
export const insertChatMessage = async ({ user_id, message, sender }) => {
  const { data, error } = await supabase
    .from('chat_history')
    .insert({ user_id, message, sender })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getChatHistory = async (user_id, limit = 200) => {
    console.log("Fetching chat history for user:", user_id, "with limit:", limit);
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data;
};

export const getLastNMessages = async (user_id, n = 5) => {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(n);
  if (error) throw error;
  // return in chronological order
  return (data || []).reverse();
};

export const clearChatHistory = async (user_id) => {
  const { error } = await supabase.from('chat_history').delete().eq('user_id', user_id);
  if (error) throw error;
  return true;
};
