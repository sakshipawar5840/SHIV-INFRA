import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/axiosClient';
import { TaskItem } from '../types';
import { Dialog } from '../components/Dialog';
import { Plus, Search, CheckCircle2, Circle, AlertCircle, Calendar as CalendarIcon, ClipboardList, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const Tasks: React.FC = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formPriority, setFormPriority] = useState<'High' | 'Medium' | 'Low' | ''>('');
  const [formAssigned, setFormAssigned] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const res = await apiClient.get('/v1/tasks');
        setTasks(res.data?.data ?? []);
      } catch (err) {
        console.error('Failed to load tasks', err);
        toast.showToast('Failed to load tasks', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formTitle.trim()) errors.title = 'Task title is required';
    if (!formDate) errors.date = 'Due date is required';
    if (!formPriority) errors.priority = 'Priority is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.showToast('Please fill all required fields.', 'warning');
      return;
    }

    setFormErrors({});

    try {
      const payload: any = {
        title: formTitle,
        due_date: formDate,
        priority: formPriority,
      };

      if (formAssigned && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formAssigned)) {
        payload.assigned_to = formAssigned;
      }

      const res = await apiClient.post('/v1/tasks', payload);
      if (res.data?.success) {
        setTasks(prev => [res.data.data, ...prev]);
        toast.showToast('Task created successfully', 'success');
        setIsAddOpen(false);
        setFormTitle('');
        setFormDate('');
        setFormPriority('');
        setFormAssigned('');
        setFormErrors({});
      }
    } catch (err) {
      console.error('Failed to create task', err);
      toast.showToast('Failed to create task', 'error');
    }
  };

  const toggleTaskStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const nextStatus: 'Completed' | 'Pending' = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      const res = await apiClient.put(`/v1/tasks/${id}`, { status: nextStatus });
      if (res.data?.success) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
        toast.showToast(`Task marked as ${nextStatus}`, 'success');
      }
    } catch (err) {
      console.error('Failed to update task', err);
      toast.showToast('Failed to update task', 'error');
    }
  };

  const handleDeleteTask = (id: string, title: string) => {
    const task = tasks.find(t => t.id === id);
    setSelectedTask(task || null);
    setIsDeleteOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      const res = await apiClient.delete(`/v1/tasks/${selectedTask.id}`);
      if (res.data?.success) {
        setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
        toast.showToast('Task deleted successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to delete task', err);
      toast.showToast('Failed to delete task', 'error');
    } finally {
      setIsDeleteOpen(false);
      setSelectedTask(null);
    }
  };

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.assigned_to.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-text-primary font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">Tasks, Milestones & Checklists</h2>
          <p className="text-xs text-text-secondary mt-0.5">Track daily civil milestones, quality auditing audits, and site execution parameters.</p>
        </div>
        <button
          onClick={() => {
            setFormTitle('');
            setFormDate('');
            setFormPriority('');
            setFormAssigned('');
            setFormErrors({});
            setIsAddOpen(true);
          }}
          className="flex items-center space-x-1.5 bg-primary text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg cursor-pointer"
        >
          <Plus size={14} />
          <span>New Task</span>
        </button>
      </div>

      <div className="bg-surface border border-border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-secondary">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search tasks, priorities, executors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface/80 border border-border text-text-primary placeholder-text-secondary rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono text-text-secondary">
          <span className="flex items-center"><CheckCircle2 size={12} className="text-success mr-1" /> {tasks.filter(t => t.status === 'Completed').length} Done</span>
          <span className="flex items-center"><Circle size={12} className="text-warning mr-1 animate-pulse" /> {tasks.filter(t => t.status === 'Pending').length} Pending</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-5 space-y-4">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center">
            <ClipboardList size={14} className="mr-2 text-warning" /> Active Site Checklist
          </span>
          <div className="space-y-2.5">
            {filteredTasks.map(t => (
              <div key={t.id} className="bg-surface/40 border border-border/80 p-3.5 rounded-xl flex items-start justify-between group hover:border-border transition-colors">
                <div className="flex space-x-3 items-start min-w-0">
                  <button onClick={() => toggleTaskStatus(t.id)} className="mt-0.5 text-text-secondary hover:text-primary transition-colors shrink-0 cursor-pointer">
                    {t.status === 'Completed' ? (
                      <CheckCircle2 size={16} className="text-success bg-success" />
                    ) : (
                      <Circle size={16} className="text-text-secondary" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold ${t.status === 'Completed' ? 'text-text-secondary line-through' : 'text-text-primary'}`}>{t.title}</p>
                    <p className="text-[10px] text-text-secondary mt-1 font-mono">Assigned: {t.assigned_to} • Due: {t.due_date}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    t.priority === 'High' ? 'bg-danger/5 text-danger border border-danger/20 animate-pulse' :
                    t.priority === 'Medium' ? 'bg-warning/5 text-warning border border-warning/20' :
                    'bg-surface border border-border text-text-secondary'
                  }`}>
                    {t.priority}
                  </span>

                  <button onClick={() => handleDeleteTask(t.id, t.title)} className="p-1 text-text-secondary hover:text-danger hover:bg-bg-app rounded transition-all cursor-pointer">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}

            {filteredTasks.length === 0 && (
              <p className="text-xs text-center text-text-secondary py-6">No tasks logged in checklist</p>
            )}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center">
            <CalendarIcon size={14} className="mr-2 text-primary" /> Deadline Calendars
          </span>
          <div className="grid grid-cols-7 gap-1 text-center text-[8px] font-bold text-text-secondary uppercase mb-2">
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[9px] font-mono text-center">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`offset-${i}`} className="h-6 opacity-0"></div>
            ))}
            {Array.from({ length: 31 }, (_, idx) => {
              const dayNum = idx + 1;
              const paddedDay = String(dayNum).padStart(2, '0');
              const matchDate = `2026-07-${paddedDay}`;
              const hasTask = tasks.some(t => t.due_date === matchDate);
              return (
                <div key={dayNum} className={`h-8 flex flex-col items-center justify-center rounded-lg relative ${
                  hasTask ? 'bg-warning/10 border border-warning/20 text-warning font-bold' : 'text-text-secondary hover:bg-surface/40'
                }`}>
                  <span>{dayNum}</span>
                  {hasTask && <span className="absolute bottom-1 h-1 w-1 bg-warning rounded-full animate-ping"></span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Log Task Milestone">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Task Description / Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Conduct slab casting durability survey..."
              className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none ${formErrors.title ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
            />
            {formErrors.title && <p className="text-[10px] text-danger mt-1">{formErrors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Due Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none font-mono ${formErrors.date ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              />
              {formErrors.date && <p className="text-[10px] text-danger mt-1">{formErrors.date}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Priority</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as any)}
                className="w-full bg-surface border border-border text-text-primary rounded-xl px-3.5 py-2 text-xs focus:outline-none font-sans"
              >
                <option value="">Select Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Assigned Executor</label>
              <select
                value={formAssigned}
                onChange={(e) => setFormAssigned(e.target.value)}
                className={`w-full bg-surface border rounded-xl px-3.5 py-2 text-xs focus:outline-none font-sans ${formErrors.assigned ? 'border-rose-500 text-danger' : 'border-border text-text-primary'}`}
              >
                <option value="">Select Executor</option>
                <option value="Eng. Yash Deshmukh">Eng. Yash Deshmukh</option>
                <option value="Eng. Rahul Salunkhe">Eng. Rahul Salunkhe</option>
                <option value="Vijay Shinde">Sales Rep. Vijay Shinde</option>
              </select>
              {formErrors.assigned && <p className="text-[10px] text-danger mt-1">{formErrors.assigned}</p>}
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
              Record Task
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Task">
        <div className="space-y-4 font-sans">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete <span className="font-semibold text-text-primary">{selectedTask?.title}</span>?
          </p>
          <div className="bg-danger/5 border border-rose-500/20 p-3 rounded-xl text-xs text-danger flex items-start space-x-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>This action cannot be undone. The task will be permanently removed.</span>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="bg-surface border border-border hover:bg-surface text-text-secondary hover:text-text-primary px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeleteTask}
              className="bg-danger hover:bg-danger/90 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-lg shadow-danger/10 transition-all cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
