import { useState, useEffect } from 'react';
import { getInventoryByStore, updateInventoryQuantity } from '../../lib/api/inventory';
import { type StoreInventory } from '../../types/inventory';
import { useAuth } from '../../context/AuthContext';
import { Minus, Plus, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GasTanksWidgetProps {
    storeId?: string; // Optional: If passed, track for that specific store
    stores: { id: string; name: string }[];
}

export default function GasTanksWidget({ storeId: initialStoreId, stores }: GasTanksWidgetProps) {
    const { user } = useAuth();
    const [selectedStoreId, setSelectedStoreId] = useState<string>(initialStoreId || '');
    const [inventoryRecord, setInventoryRecord] = useState<StoreInventory | null>(null);
    const [quantity, setQuantity] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Sync selected store when initial store changes
    useEffect(() => {
        if (initialStoreId) {
            setSelectedStoreId(initialStoreId);
        }
    }, [initialStoreId]);

    // Fetch inventory for the selected store
    useEffect(() => {
        async function fetchInventory() {
            if (!selectedStoreId) {
                setInventoryRecord(null);
                setQuantity(0);
                return;
            }

            setLoading(true);
            try {
                const data = await getInventoryByStore(selectedStoreId);
                const gasTankRecord = data.find(item => item.item_type === 'Gas Tank');
                if (gasTankRecord) {
                    setInventoryRecord(gasTankRecord);
                    setQuantity(gasTankRecord.quantity);
                } else {
                    setInventoryRecord(null);
                    setQuantity(0);
                }
            } catch (error) {
                console.error("Error fetching gas tanks count:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchInventory();
    }, [selectedStoreId]);

    const handleUpdate = async () => {
        if (!selectedStoreId || !user) return;
        setSaving(true);
        try {
            const updatedRecord = await updateInventoryQuantity(
                selectedStoreId,
                'Gas Tank',
                quantity,
                user.id
            );
            setInventoryRecord(updatedRecord);
        } catch (error) {
            console.error("Failed to update gas tanks:", error);
            alert("Failed to update inventory.");
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = inventoryRecord ? inventoryRecord.quantity !== quantity : quantity !== 0;

    return (
        <div className="bg-white border border-black p-4 flex flex-col md:flex-row items-center gap-4">
            <div className="flex flex-col flex-1 shrink-0 w-full md:w-auto">
                <span className="text-sm font-bold uppercase tracking-wider text-black">How many empty gas tanks do you have?</span>
                {inventoryRecord?.last_updated_at ? (
                    <span className="text-xs text-gray-500 font-medium mt-0.5">
                        Updated {formatDistanceToNow(new Date(inventoryRecord.last_updated_at), { addSuffix: true })}
                        {inventoryRecord.profiles?.full_name && ` by ${inventoryRecord.profiles.full_name}`}
                    </span>
                ) : (
                    <span className="text-xs text-gray-500 font-medium mt-0.5">No updates yet</span>
                )}
            </div>

            <div className="flex-1 w-full md:w-auto">
                {stores.length > 1 && !initialStoreId ? (
                    <select
                        value={selectedStoreId}
                        onChange={(e) => setSelectedStoreId(e.target.value)}
                        className="w-full text-sm font-medium border-b-2 border-transparent hover:border-black focus:border-black focus:outline-none py-1 transition-colors bg-white cursor-pointer"
                    >
                        <option value="" disabled>Select a store</option>
                        {stores.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                ) : (
                    <div className="text-sm font-medium text-gray-800">
                        {stores.find(s => s.id === selectedStoreId)?.name || 'Select a store...'}
                    </div>
                )}
            </div>

            <div className={`flex items-center gap-3 w-full md:w-auto ${!selectedStoreId ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center border-2 border-black bg-gray-50">
                    <button
                        onClick={() => setQuantity(Math.max(0, quantity - 1))}
                        disabled={loading || saving}
                        className="p-2 hover:bg-black hover:text-white transition-colors active:scale-95 disabled:opacity-50"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <div className="w-12 text-center font-bold text-lg leading-none py-2 text-black bg-white border-x-2 border-black">
                        {loading ? '...' : quantity}
                    </div>
                    <button
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={loading || saving}
                        className="p-2 hover:bg-black hover:text-white transition-colors active:scale-95 disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <button
                    onClick={handleUpdate}
                    disabled={!hasChanges || loading || saving}
                    className={`
                        px-4 py-2.5 font-bold text-sm tracking-wide uppercase transition-all
                        flex items-center gap-2 border-2 
                        ${hasChanges
                            ? 'bg-black text-white border-black hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-0 active:shadow-none'
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }
                    `}
                >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Update'}
                </button>
            </div>
        </div>
    );
}
