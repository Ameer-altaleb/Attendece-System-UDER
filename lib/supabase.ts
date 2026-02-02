
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = 'https://riuhndnuziycarmlllzs.supabase.co';
const supabaseKey = 'sb_publishable_q3BMLdmSMAgzxbreYXlaWg_Nur-Gm5S'; 

export const supabase = createClient(supabaseUrl, supabaseKey);

export const checkSupabaseConnection = () => {
  return !!supabaseUrl && !!supabaseKey;
};
