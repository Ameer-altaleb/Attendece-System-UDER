
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = 'https://riuhndnuziycarmlllzs.supabase.co';
// يرجى استبدال هذا النص بمفتاح ANON الفعلي من Supabase
const supabaseKey = 'sb_publishable_q3BMLdmSMAgzxbreYXlaWg_Nur-Gm5S'; 

// التحقق مما إذا كان المفتاح هو النص التجريبي لمنع الانهيار
const isPlaceholder = supabaseKey === 'sb_publishable_q3BMLdmSMAgzxbreYXlaWg_Nur-Gm5S';

export const supabase = createClient(supabaseUrl, isPlaceholder ? 'none' : supabaseKey);

export const checkSupabaseConnection = () => !isPlaceholder;
