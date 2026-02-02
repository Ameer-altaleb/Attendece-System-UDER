
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = 'https://riuhndnuziycarmlllzs.supabase.co';
// يرجى استبدال هذا النص بمفتاح ANON الفعلي من Supabase
const supabaseKey = 'YOUR_ACTUAL_ANON_KEY_FROM_SUPABASE'; 

// التحقق مما إذا كان المفتاح هو النص التجريبي لمنع الانهيار
const isPlaceholder = supabaseKey === 'YOUR_ACTUAL_ANON_KEY_FROM_SUPABASE';

export const supabase = createClient(supabaseUrl, isPlaceholder ? 'none' : supabaseKey);

export const checkSupabaseConnection = () => !isPlaceholder;
