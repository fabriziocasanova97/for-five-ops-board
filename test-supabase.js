import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    console.log("No url");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testGetAllInventory() {
    try {
        const { data, error } = await supabase
            .from('store_inventory')
            .select('*');
        if (error) {
            console.log("ERROR:", JSON.stringify(error));
        } else {
            console.log("SUCCESS, rows:", data?.length);
        }
    } catch (err) {
        console.log("CATCH ERROR:", err);
    }
}
testGetAllInventory();
