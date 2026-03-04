import { supabase } from '../supabase';
import type { StoreInventory } from '../../types/inventory';

export async function getInventoryByStore(storeId: string): Promise<StoreInventory[]> {
    const { data, error } = await supabase
        .from('store_inventory')
        .select(`
            *,
            stores (name),
            profiles (full_name)
        `)
        .eq('store_id', storeId)
        .order('item_type');

    if (error) {
        console.error('Error fetching inventory for store:', error);
        throw error;
    }

    return data as StoreInventory[];
}

export async function getAllInventory(): Promise<StoreInventory[]> {
    const { data, error } = await supabase
        .from('store_inventory')
        .select(`
            *,
            stores (name),
            profiles (full_name)
        `)
        .order('store_id')
        .order('item_type');

    if (error) {
        console.error('Error fetching all inventory:', error);
        throw error;
    }

    return data as StoreInventory[];
}

export async function updateInventoryQuantity(
    storeId: string,
    itemType: string,
    quantity: number,
    userId: string
): Promise<StoreInventory> {
    const { data, error } = await supabase
        .from('store_inventory')
        .upsert(
            {
                store_id: storeId,
                item_type: itemType,
                quantity: quantity,
                last_updated_by: userId,
                last_updated_at: new Date().toISOString()
            },
            {
                onConflict: 'store_id,item_type'
            }
        )
        .select(`
            *,
            stores (name),
            profiles (full_name)
        `)
        .single();

    if (error) {
        console.error('Error updating inventory:', error);
        throw error;
    }

    return data as StoreInventory;
}

export async function deleteInventoryRecord(id: string): Promise<void> {
    const { error } = await supabase
        .from('store_inventory')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting inventory record:', error);
        throw error;
    }
}
