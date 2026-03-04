import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAllInventory } from '../lib/api/inventory';
import { type StoreInventory as StoreInventoryType } from '../types/inventory';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { RefreshCw, Search, AlertTriangle, Trash2 } from 'lucide-react';
import GasTanksWidget from '../components/board/GasTanksWidget';
import { deleteInventoryRecord } from '../lib/api/inventory';

export default function StoreInventory() {
    const [inventory, setInventory] = useState<StoreInventoryType[]>([]);
    const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invData, storesRes] = await Promise.all([
                getAllInventory(),
                supabase.from('stores').select('id, name').order('name')
            ]);
            setInventory(invData);
            setStores(storesRes.data || []);
        } catch (error) {
            console.error('Failed to fetch store inventory data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, storeName: string) => {
        if (!window.confirm(`Are you sure you want to delete the gas tanks inventory record for ${storeName}?`)) {
            return;
        }

        try {
            await deleteInventoryRecord(id);
            setInventory(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error('Failed to delete record:', error);
            alert('Failed to delete the inventory record.');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredInventory = inventory.filter(item => {
        if (!searchQuery) return true;
        return item.stores?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const getStatusStyles = (item: StoreInventoryType) => {
        const hoursSinceUpdate = differenceInHours(new Date(), new Date(item.last_updated_at));
        const isLowStock = item.quantity < 2;
        const needsUpdate = hoursSinceUpdate > 48;

        if (isLowStock) {
            return 'bg-red-50 border-red-500 text-red-900 border-l-4';
        }
        if (needsUpdate) {
            return 'bg-yellow-50 border-yellow-500 text-yellow-900 border-l-4';
        }
        return 'bg-white border-gray-200 border-l-4 border-l-transparent text-gray-900 border';
    };

    return (
        <div className="h-full flex flex-col max-w-6xl mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Gas Tanks</h2>
                    <p className="text-sm text-gray-500 mt-1">Bird's-eye view of all location stock levels.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find a store..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border-2 border-black focus:ring-2 focus:ring-black bg-white shadow-sm outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2 bg-black text-white hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="mb-6 w-full max-w-2xl">
                <GasTanksWidget stores={stores} />
            </div>

            <div className="flex-1 min-h-0 bg-white border border-gray-200 shadow-sm relative overflow-hidden flex flex-col">
                {loading && inventory.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                        <div className="animate-spin h-8 w-8 border-b-2 border-black"></div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-[#f8f8f8] sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-widest border-b-2 border-black">
                                        Store
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-widest border-b-2 border-black">
                                        Item
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-900 uppercase tracking-widest border-b-2 border-black">
                                        Quantity
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-900 uppercase tracking-widest border-b-2 border-black">
                                        Last Updated
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-widest border-b-2 border-black">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-4 border-b-2 border-black"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredInventory.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                                            No inventory records found. Add them using the Gas Tanks Widget on the main board.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInventory.map((item) => {
                                        const isLowStock = item.quantity < 2;
                                        const needsUpdate = differenceInHours(new Date(), new Date(item.last_updated_at)) > 48;
                                        const statusClasses = getStatusStyles(item);

                                        return (
                                            <tr key={item.id} className={`${statusClasses} transition-colors group hover:bg-gray-50`}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                    {item.stores?.name || 'Unknown Store'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                                                    {item.item_type}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                    <span className={`inline-flex items-center justify-center px-2.5 py-1 min-w-[32px] rounded-sm font-bold border ${isLowStock ? 'bg-red-600 text-white border-red-700' : 'bg-gray-100 text-gray-900 border-gray-300'}`}>
                                                        {item.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                                    <div className="flex flex-col items-end">
                                                        <span>{formatDistanceToNow(new Date(item.last_updated_at), { addSuffix: true })}</span>
                                                        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mt-0.5">by {item.profiles?.full_name || 'System'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {isLowStock ? (
                                                        <div className="flex items-center text-red-700 font-bold uppercase tracking-wide text-xs">
                                                            <AlertTriangle className="w-4 h-4 mr-1.5" />
                                                            Critical Low
                                                        </div>
                                                    ) : needsUpdate ? (
                                                        <div className="flex items-center text-yellow-700 font-bold uppercase tracking-wide text-xs">
                                                            <AlertTriangle className="w-4 h-4 mr-1.5" />
                                                            Needs Update
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">OK</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    <button
                                                        onClick={() => handleDelete(item.id, item.stores?.name || 'Unknown Store')}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                                                        aria-label="Delete record"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
