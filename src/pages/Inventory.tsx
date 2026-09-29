import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/axiosClient';
import { InventoryItem } from '../types';
import { Dialog } from '../components/Dialog';
import { Plus, Search, Warehouse, AlertTriangle, ArrowUpRight, DollarSign, Package, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const Inventory: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formQty, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formMinLevel, setFormMinLevel] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadItems = async () => {
      try {
        const res = await apiClient.get('/v1/inventory', { params: { q: search || undefined } });
        setItems(res.data?.data ?? []);
      } catch (err) {
        console.error('Failed to load inventory', err);
        toast.showToast('Failed to load inventory', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formName.trim()) errors.name = 'Material name is required';
    if (!formCategory) errors.category = 'Category is required';
    if (!formQty || Number(formQty) <= 0) errors.qty = 'Enter a valid quantity';
    if (!formUnit) errors.unit = 'Unit is required';
    if (!formMinLevel || Number(formMinLevel) < 0) errors.minLevel = 'Enter a valid minimum level';
    if (!formPrice || Number(formPrice) < 0) errors.price = 'Enter a valid price';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.showToast('Please fill all required fields.', 'warning');
      return;
    }

    setFormErrors({});

    try {
      const payload = {
        item_name: formName,
        category: formCategory,
        quantity: Number(formQty),
        unit: formUnit,
        minimum_stock: Number(formMinLevel),
        unit_price: Number(formPrice),
      };

      const res = await apiClient.post('/v1/inventory', payload);
      if (res.data?.success) {
        setItems(prev => [res.data.data, ...prev]);
        toast.showToast('Inventory item added successfully', 'success');
        setIsAddOpen(false);
        setFormName('');
        setFormCategory('');
        setFormQuantity('');
        setFormUnit('');
        setFormMinLevel('');
        setFormPrice('');
        setFormErrors({});
      }
    } catch (err) {
      console.error('Failed to add inventory item', err);
      toast.showToast('Failed to add inventory item', 'error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await apiClient.delete(`/v1/inventory/${id}`);
      if (res.data?.success) {
        setItems(prev => prev.filter(i => i.id !== id));
        toast.showToast('Inventory item removed', 'success');
      }
    } catch (err) {
      console.error('Failed to delete inventory item', err);
      toast.showToast('Failed to delete inventory item', 'error');
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const lowStockCount = items.filter(item => item.quantity <= item.minimum_stock).length;

  const filteredItems = items.filter(i =>
    i.item_name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase()) ||
     i.unit.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-text-primary font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">Materials & Site Inventory</h2>
          <p className="text-xs text-text-secondary mt-0.5">Monitor physical warehouse supplies, low stock thresholds, and logistics audits.</p>
        </div>
<button
          onClick={() => {
            setFormName('');
            setFormCategory('');
            setFormQuantity('');
            setFormUnit('');
            setFormMinLevel('');
            setFormPrice('');
            setFormErrors({});
            setIsAddOpen(true);
          }}
          className="flex items-center space-x-1.5 bg-primary text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg cursor-pointer"
        >
          <Plus size={14} />
          <span>Record Shipment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase">Valuation of Stock</span>
            <h3 className="text-xl font-bold font-mono text-success mt-1">₹ {totalValue.toLocaleString('en-IN')}</h3>
          </div>
          <DollarSign size={20} className="bg-success bg-success/5 p-1.5 rounded-xl h-9 w-9" />
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase">Total Items Registered</span>
            <h3 className="text-xl font-bold font-mono text-text-primary mt-1">{items.length} Category Units</h3>
          </div>
          <Package size={20} className="text-teal bg-teal/10 p-1.5 rounded-xl h-9 w-9" />
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase">Low Stock Alerts</span>
            <h3 className="text-xl font-bold font-mono text-danger mt-1">{lowStockCount} Items Critical</h3>
          </div>
          <AlertTriangle size={20} className="text-danger bg-danger/5 p-1.5 rounded-xl h-9 w-9" />
        </div>
      </div>

      <div className="bg-surface border border-border p-4 rounded-2xl">
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-secondary">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search active material stocks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface/80 border border-border text-text-primary placeholder-text-secondary rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
<thead className="bg-surface font-mono text-[10px] uppercase text-text-secondary border-b border-border">
              <tr>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Min Stock Level</th>
                <th className="py-3 px-4">Available Quantity</th>
                <th className="py-3 px-4 text-right">Rate/Unit</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-text-secondary font-mono">
              {filteredItems.map(item => {
                const isCritical = item.quantity <= item.minimum_stock;
                return (
                  <tr key={item.id} className="hover:bg-bg-app transition-colors">
                    <td className="py-3.5 px-4 font-sans font-bold text-text-primary">{item.item_name}</td>
                    <td className="py-3.5 px-4"><span className="bg-surface px-2 py-0.5 rounded border border-border text-text-secondary">{item.category}</span></td>
                    <td className="py-3.5 px-4 font-sans text-text-secondary">{item.minimum_stock}</td>
                    <td className="py-3.5 px-4 text-text-primary font-semibold">{item.quantity} {item.unit}</td>
                    <td className="py-3.5 px-4 text-right">₹ {item.unit_price}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isCritical ? 'bg-danger/5 text-danger border border-danger/20' : 'bg-success/5 text-success border border-success/20'
                      }`}>
                        {isCritical ? 'Low Stock' : 'Optimized'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button onClick={() => handleDeleteItem(item.id)} className="text-text-secondary hover:text-danger p-1 hover:bg-bg-app rounded transition-all cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record Incoming Shipment">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Material/Item Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. TATA Tiscon Steel 16mm"
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              >
                <option value="">Select Category</option>
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
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Shipped Qty</label>
              <input
                type="number"
                value={formQty}
                onChange={(e) => setFormQuantity(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">UOM/Unit</label>
              <input
                type="text"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                placeholder="Bags, Tons..."
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Rate per Unit (INR)</label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Min Safety level</label>
              <input
type="number"
                value={formMinLevel}
                onChange={(e) => setFormMinLevel(e.target.value)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="bg-surface border border-border hover:bg-surface text-text-secondary hover:text-text-primary px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg cursor-pointer"
            >
              Log Entry
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

