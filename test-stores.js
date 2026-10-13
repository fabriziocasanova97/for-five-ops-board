import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStores() {
    const { data, error } = await supabase.from('stores').select('id, name').order('name');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Stores count:', data?.length);
    }
}
testStores();
