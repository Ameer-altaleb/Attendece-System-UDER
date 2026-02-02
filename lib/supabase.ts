
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// استبدل YOUR_ACTUAL_ANON_KEY_FROM_SUPABASE بمفتاح anon public الفعلي من لوحة تحكم Supabase
const supabaseUrl = 'https://riuhndnuziycarmlllzs.supabase.co';
const supabaseKey = 'sb_publishable_q3BMLdmSMAgzxbreYXlaWg_Nur-Gm5S'; 

export const supabase = createClient(supabaseUrl, supabaseKey);
