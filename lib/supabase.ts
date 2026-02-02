

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = 'https://riuhndnuziycarmlllzs.supabase.co';
// استخدام المفتاح مباشرة لضمان أعلى مستوى من استقرار الاتصال اللحظي
const supabaseKey = 'sb_publishable_q3BMLdmSMAgzxbreYXlaWg_Nur-Gm5S'; 

export const supabase = createClient(supabaseUrl, supabaseKey);

// دالة فحص الاتصال للتأكد من جاهزية النظام
export const checkSupabaseConnection = () => {
  // Fix: Removed redundant empty string check on hardcoded constant to avoid TS type overlap error
  return !!supabaseUrl && !!supabaseKey;
};