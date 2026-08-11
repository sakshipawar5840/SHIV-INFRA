import React, { useState, useEffect } from 'react';
import { getStoredData, saveStoredData, INITIAL_TASKS, logSystemAction } from '../lib/mockData';
import { TaskItem } from '../types';
import { Dialog } from '../components/Dialog';
import { Plus, Search, CheckCircle2, Circle, AlertCircle, Calendar as CalendarIcon, ClipboardList, Trash2 } from 'lucide-react';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('2026-07-08');
  const [formPriority, setFormPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [formAssigned, setFormAssigned] = useState('Eng. Yash Deshmukh');

  useEffect(() => {
    setTasks(getStoredData<TaskItem[]>('tasks', INITIAL_TASKS));
  }, []);

  const handleSaveTasks = (data: TaskItem[]) => {
    setTasks(data);
    saveStoredData('tasks', data);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) return;

    const newTask: TaskItem = {
      id: `t_${Date.now()}`,
      title: formTitle,
      due_date: formDate,
      priority: formPriority,
      status: 'Pending',
      assigned_to: formAssigned
    };

    const updated = [newTask, ...tasks];
    handleSaveTasks(updated);
    logSystemAction('Create', `Civil task milestone registered: "${formTitle}"`);
    setIsAddOpen(false);
  };

  const toggleTaskStatus = (id: string) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextStatus: 'Completed' | 'Pending' = t.status === 'Completed' ? 'Pending' : 'Completed';
        logSystemAction('Update', `Task "${t.title}" toggled status to ${nextStatus}`);
        return { ...t, status: nextStatus };
      }
      return t;
    });
    handleSaveTasks(updated);
  };

  const handleDeleteTask = (id: string, title: string) => {
    const updated = tasks.filter(t => t.id !== id);
    handleSaveTasks(updated);
    logSystemAction('Delete', `Task milestone "${title}" unlinked`);
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.assigned_to.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Tasks, Milestones & Checklists</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track daily civil milestones, quality auditing audits, and site execution parameters.</p>
        </div>
        <button
          onClick={() => {
            setFormTitle('');
            setIsAddOpen(true);
          }}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg cursor-pointer"
        >
          <Plus size={14} />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter and search */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search tasks, priorities, executors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none"
          />
        </div>

        {/* Small legend summary */}
        <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
          <span className="flex items-center"><CheckCircle2 size={12} className="text-emerald-400 mr-1" /> {tasks.filter(t => t.status === 'Completed').length} Done</span>
          <span className="flex items-center"><Circle size={12} className="text-sky-400 mr-1 animate-pulse" /> {tasks.filter(t => t.status === 'Pending').length} Pending</span>
        </div>
      </div>

      {/* Dual Column workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Checklist */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
            <ClipboardList size={14} className="mr-2 text-sky-400" /> Active Site Checklist
          </span>
          <div className="space-y-2.5">
            {filteredTasks.map(t => (
              <div key={t.id} className="bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-xl flex items-start justify-between group hover:border-slate-700 transition-colors">
                <div className="flex space-x-3 items-start min-w-0">
                  <button onClick={() => toggleTaskStatus(t.id)} className="mt-0.5 text-slate-500 hover:text-sky-400 transition-colors shrink-0 cursor-pointer">
                    {t.status === 'Completed' ? (
                      <CheckCircle2 size={16} className="text-emerald-400 fill-emerald-500/10" />
                    ) : (
                      <Circle size={16} className="text-slate-600" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold ${t.status === 'Completed' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{t.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">Assigned: {t.assigned_to} • Due: {t.due_date}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    t.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10 animate-pulse' :
                    t.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                    'bg-slate-500/10 text-slate-400 border border-slate-800'
                  }`}>
                    {t.priority}
                  </span>

                  <button onClick={() => handleDeleteTask(t.id, t.title)} className="p-1 text-slate-600 hover:text-rose-400 hover:bg-slate-800 rounded transition-all cursor-pointer">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}

            {filteredTasks.length === 0 && (
              <p className="text-xs text-center text-slate-600 py-6">No tasks logged in checklist</p>
            )}
          </div>
        </div>

        {/* July Calendar deadlines summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
            <CalendarIcon size={14} className="mr-2 text-indigo-400" /> Deadline Calendars
          </span>
          <div className="grid grid-cols-7 gap-1 text-center text-[8px] font-bold text-slate-600 uppercase mb-2">
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[9px] font-mono text-center">
            {/* Offline Wednesday July offset */}
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
                  hasTask ? 'bg-sky-500/10 border border-sky-500/20 text-sky-300 font-bold' : 'text-slate-500 hover:bg-slate-950/40'
                }`}>
                  <span>{dayNum}</span>
                  {hasTask && <span className="absolute bottom-1 h-1 w-1 bg-sky-400 rounded-full animate-ping"></span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dialog add task */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Log Task Milestone">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Task Description / Title</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Conduct slab casting durability survey..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Due Date</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none font-sans"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Assigned Executor</label>
              <select
                value={formAssigned}
                onChange={(e) => setFormAssigned(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none font-sans"
              >
                <option value="Eng. Yash Deshmukh">Eng. Yash Deshmukh</option>
                <option value="Eng. Rahul Salunkhe">Eng. Rahul Salunkhe</option>
                <option value="Vijay Shinde">Sales Rep. Vijay Shinde</option>
              </select>
            </div>
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
              Record Task
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
export default Tasks;
