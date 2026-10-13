export interface StoreInventory {
    id: string;
    store_id: string;
    quantity: number;
    last_updated_at: string;
    last_updated_by: string;
    created_at: string;
    stores?: {
        name: string;
    };
    profiles?: {
        full_name: string;
    };
}
