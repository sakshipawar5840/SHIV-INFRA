import React, { useState, useEffect } from 'react';
import { getStoredData, saveStoredData, INITIAL_INVENTORY, logSystemAction } from '../lib/mockData';
import { InventoryItem } from '../types';
import { Dialog } from '../components/Dialog';
import { Plus, Search, Warehouse, AlertTriangle, ArrowUpRight, DollarSign, Package } from 'lucide-react';

export const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Cement');
  const [formQty, setFormQuantity] = useState('500');
  const [formUnit, setFormUnit] = useState('Bags');
  const [formMinLevel, setFormMinLevel] = useState('100');
  const [formPrice, setFormPrice] = useState('450');
  const [formLocation, setFormLocation] = useState('Hinjewadi Central Yard');

  useEffect(() => {
    setItems(getStoredData<InventoryItem[]>('inventory', INITIAL_INVENTORY));
  }, []);

  const handleSaveInventory = (data: InventoryItem[]) => {
    setItems(data);
    saveStoredData('inventory', data);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formQty || !formPrice) return;

    const newItem: InventoryItem = {
      id: `i_${Date.now()}`,
      item_name: formName,
      category: formCategory,
      quantity: Number(formQty),
      unit: formUnit,
      minimum_level: Number(formMinLevel),
      unit_price: Number(formPrice),
      warehouse_location: formLocation
    };

    const updated = [newItem, ...items];
    handleSaveInventory(updated);
    logSystemAction('Create', `Inventory material item registered: "${formName}"`);
    setIsAddOpen(false);
  };

  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const lowStockCount = items.filter(item => item.quantity <= item.minimum_level).length;

  const filteredItems = items.filter(i => 
    i.item_name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase()) ||
    i.warehouse_location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Materials & Site Inventory</h2>
          <p className="text-xs text-slate-400 mt-0.5">Monitor physical warehouse supplies, low stock thresholds, and logistics audits.</p>
        </div>
        <button
          onClick={() => {
            setFormName('');
            setIsAddOpen(true);
          }}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg cursor-pointer"
        >
          <Plus size={14} />
          <span>Record Shipment</span>
        </button>
      </div>

      {/* Metrics HUD Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Valuation of Stock</span>
            <h3 className="text-xl font-bold font-mono text-emerald-400 mt-1">₹ {totalValue.toLocaleString('en-IN')}</h3>
          </div>
          <DollarSign size={20} className="text-emerald-500 bg-emerald-500/10 p-1.5 rounded-xl h-9 w-9" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Items Registered</span>
            <h3 className="text-xl font-bold font-mono text-slate-100 mt-1">{items.length} Category Units</h3>
          </div>
          <Package size={20} className="text-sky-400 bg-sky-500/10 p-1.5 rounded-xl h-9 w-9" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Low Stock Alerts</span>
            <h3 className="text-xl font-bold font-mono text-rose-400 mt-1">{lowStockCount} Items Critical</h3>
          </div>
          <AlertTriangle size={20} className="text-rose-500 bg-rose-500/10 p-1.5 rounded-xl h-9 w-9" />
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search active material stocks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Data Grid list */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 font-mono text-[10px] uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Warehouse Site</th>
                <th className="py-3 px-4">Available Quantity</th>
                <th className="py-3 px-4 text-right">Rate/Unit</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono">
              {filteredItems.map(item => {
                const isCritical = item.quantity <= item.minimum_level;
                return (
                  <tr key={item.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-bold text-slate-200">{item.item_name}</td>
                    <td className="py-3.5 px-4"><span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400">{item.category}</span></td>
                    <td className="py-3.5 px-4 font-sans text-slate-400">{item.warehouse_location}</td>
                    <td className="py-3.5 px-4 text-slate-100 font-semibold">{item.quantity} {item.unit}</td>
                    <td className="py-3.5 px-4 text-right">₹ {item.unit_price}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isCritical ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                      }`}>
                        {isCritical ? 'Low Stock' : 'Optimized'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog Add Item */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record Incoming Shipment">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Material/Item Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. TATA Tiscon Steel 16mm"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              >
                <option value="Cement">Cement</option>
                <option value="Steel">Steel</option>
                <option value="Sand">Sand / Aggregates</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Shipped Qty</label>
              <input
                type="number"
                required
                value={formQty}
                onChange={(e) => setFormQuantity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">UOM/Unit</label>
              <input
                type="text"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                placeholder="Bags, Tons..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Rate per Unit (INR)</label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Min Safety level</label>
              <input
                type="number"
                value={formMinLevel}
                onChange={(e) => setFormMinLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Storage Warehouse Location</label>
            <input
              type="text"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg cursor-pointer"
            >
              Log Entry
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
export default Inventory;
