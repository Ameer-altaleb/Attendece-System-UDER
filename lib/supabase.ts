
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = 'https://riuhndnuziycarmlllzs.supabase.co';
// Added explicit string type to resolve unintentional comparison error with empty string literal
const supabaseKey: string = 'sb_publishable_q3BMLdmSMAgzxbreYXlaWg_Nur-Gm5S'; 

// التحقق مما إذا كان المفتاح صالحاً وليس مجرد نص مؤقت
const isPlaceholder = !supabaseKey || supabaseKey.includes('YOUR_ACTUAL') || supabaseKey === '';

export const supabase = createClient(supabaseUrl, isPlaceholder ? 'none' : supabaseKey);

export const checkSupabaseConnection = () => !isPlaceholder;
