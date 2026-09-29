import React, { useEffect, useState } from "react";
import { apiClient } from "../lib/axiosClient";
import {
  Building2,
  Users,
  Layers,
  Calendar,
  CheckCircle2,
  Briefcase,
  DollarSign,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Server,
  MessageCircle,
  Search,
  Loader2,
} from "lucide-react";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

import {
  Project,
  Bill,
  SiteVisit,
  ActivityLog,
} from "../types";
import { useToast } from "../contexts/ToastContext";

interface DashboardProps {
  onNavigate: (tab: string) => void;
  openChat: () => void;
}

interface DashboardData {
  projects: number;
  projects_by_status: Record<string, number>;
  customers: number;
  leads: number;
  bills: number;
  bills_total: number;
  bills_paid: number;
  bills_pending: number;
  bills_cancelled: number;
  expenses: number;
  expenses_total: number;
  total_outflow: number;
  revenue: number;
  todaysSiteVisits?: number;

  recentProjects?: Project[];
  recentBills?: Bill[];
  activities?: ActivityLog[];
  leadStatusBreakdown?: { name: string; value: number }[];
  leadFlow?: { name: string; "New Leads": number; "Interested Leads": number }[];
  expenseByCategory?: { name: string; amount: number }[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  openChat,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month" | "custom">("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    projects: 0,
    projects_by_status: {},
    customers: 0,
    leads: 0,
    bills: 0,
    bills_total: 0,
    bills_paid: 0,
    bills_pending: 0,
    bills_cancelled: 0,
    expenses: 0,
    expenses_total: 0,
    total_outflow: 0,
    revenue: 0,
    todaysSiteVisits: 0,
    recentProjects: [],
    recentBills: [],
    activities: [],
  });

  const [allProjects, setAllProjects] = useState<Project[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await apiClient.get('/v1/projects');
        setAllProjects(res.data?.data ?? []);
      } catch (err) {
        console.error('Failed to load projects for dashboard filter', err);
      }
    };
    loadProjects();
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [dateFilter, customStartDate, customEndDate, selectedProjectId]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFilter === "custom" && customStartDate && customEndDate) {
        params.from_date = customStartDate;
        params.to_date = customEndDate;
      } else if (dateFilter === "today") {
        const today = new Date().toISOString().split("T")[0];
        params.from_date = today;
        params.to_date = today;
      } else if (dateFilter === "week") {
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        params.from_date = start.toISOString().split("T")[0];
        params.to_date = end.toISOString().split("T")[0];
      } else if (dateFilter === "month") {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        params.from_date = start.toISOString().split("T")[0];
        params.to_date = end.toISOString().split("T")[0];
      }
      if (selectedProjectId) params.project_id = selectedProjectId;

      const response = await apiClient.get("/v1/dashboard", { params });
      const data = response.data?.data ?? {};

      setDashboardData({
        projects: data.projects ?? 0,
        projects_by_status: data.projects_by_status ?? {},
        customers: data.customers ?? 0,
        leads: data.leads ?? 0,
        bills: data.bills ?? 0,
        bills_total: data.bills_total ?? 0,
        bills_paid: data.bills_paid ?? 0,
        bills_pending: data.bills_pending ?? 0,
        bills_cancelled: data.bills_cancelled ?? 0,
        expenses: data.expenses ?? 0,
        expenses_total: data.expenses_total ?? 0,
        total_outflow: data.total_outflow ?? 0,
        revenue: data.revenue ?? 0,
        todaysSiteVisits: data.todaysSiteVisits ?? 0,
        recentProjects: data.recentProjects ?? [],
        recentBills: data.recentBills ?? [],
        activities: data.activities ?? [],
        leadStatusBreakdown: data.leadStatusBreakdown ?? [],
        leadFlow: data.leadFlow ?? [],
        expenseByCategory: data.expenseByCategory ?? [],
      });

      setProjects(data.recentProjects ?? []);
    } catch (error: any) {
      console.error("Dashboard Error:", error);
      toast.showToast(error.response?.data?.message || "Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (value: number) => {
    if (!value && value !== 0) return "₹ 0";
    if (value >= 10000000) return `₹ ${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹ ${(value / 100000).toFixed(2)} L`;
    return `₹ ${value.toLocaleString("en-IN")}`;
  };

  const ongoingProjectsVal = dashboardData.projects_by_status?.["Ongoing"] ?? 0;
  const completedProjectsVal = dashboardData.projects_by_status?.["Completed"] ?? 0;
  const totalExpensesSum = dashboardData.expenses_total;
  const totalRevenueVal = dashboardData.revenue;
  const billsUploadedVal = dashboardData.bills;
  const pendingUpdatesVal = dashboardData.projects_by_status?.["Planning"] ?? 0;

  const filteredRecentProjects = (dashboardData.recentProjects || []).filter(p => {
    const matchesSearch = p.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.status?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredRecentBills = (dashboardData.recentBills || []).filter(b => {
    const matchesSearch = (b.vendor_name || b.vendor || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (b.material_name || b.material || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredActivities = (dashboardData.activities || []).filter(a => {
    const matchesSearch = (a.action || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const DONUT_COLORS = ["#0A0A0A", "#505050", "#10B981", "#64748B", "#8B5CF6", "#EC4899"];
  const donutData = (dashboardData.leadStatusBreakdown ?? []).map((d, i) => ({
    name: d.name,
    value: d.value,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));
  const lineData = dashboardData.leadFlow ?? [];
  const barData = (dashboardData.expenseByCategory ?? []).map((e) => ({
    name: e.name,
    amount: e.amount,
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="text-primary animate-spin" size={24} />
          <p className="font-bold text-text-secondary">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans bg-bg-app min-h-screen p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">Executive Dashboard</h2>
          <p className="text-xs text-text-secondary mt-0.5">Live metrics from your database.</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Filter:</span>
          <div className="flex items-center space-x-1 bg-surface border border-border p-1 rounded-lg">
            {[
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' },
              { key: 'month', label: 'This Month' },
              { key: 'custom', label: 'Custom' }
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setDateFilter(opt.key as any)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  dateFilter === opt.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-app'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {dateFilter === 'custom' && (
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-surface border border-border text-text-primary rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
            />
            <span className="text-text-secondary text-xs">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-surface border border-border text-text-primary rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
            />
          </div>
        )}
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="bg-surface border border-border text-text-primary rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
        >
          <option value="">All Projects</option>
          {allProjects.map(p => (
            <option key={p.id} value={p.id}>{p.project_name}</option>
          ))}
        </select>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-secondary">
            <Search size={14} />
          </div>
          <input
            type="text"
            placeholder="Search projects, bills, activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-border text-text-primary placeholder:text-text-secondary rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {[
          {
            title: "Total Projects",
            value: dashboardData.projects,
            icon: <Building2 size={18} />,
            color: "blue",
            tab: "projects"
          },
          {
            title: "Ongoing Projects",
            value: ongoingProjectsVal,
            icon: <Layers size={18} />,
            color: "amber",
            tab: "projects"
          },
          {
            title: "Completed Projects",
            value: completedProjectsVal,
            icon: <CheckCircle2 size={18} />,
            color: "emerald",
            tab: "projects"
          },
          {
            title: "Customers",
            value: dashboardData.customers,
            icon: <Users size={18} />,
            color: "indigo",
            tab: "customers"
          },
          {
            title: "Active Leads",
            value: dashboardData.leads,
            icon: <Briefcase size={18} />,
            color: "rose",
            tab: "leads"
          },
          {
            title: "Total Bills",
            value: billsUploadedVal,
            icon: <Receipt size={18} />,
            color: "violet",
            tab: "bills"
          },
          {
            title: "Total Expenses",
            value: dashboardData.expenses,
            icon: <DollarSign size={18} />,
            color: "orange",
            tab: "expenses"
          },
          {
            title: "Total Outflow",
            value: formatINR(dashboardData.total_outflow),
            icon: <DollarSign size={18} />,
            color: "emerald",
            tab: "reports"
          },
          {
            title: "Pending Bills",
            value: formatINR(dashboardData.bills_pending),
            icon: <AlertTriangle size={18} />,
            color: "amber",
            tab: "bills"
          },
          {
            title: "Paid Bills",
            value: formatINR(dashboardData.bills_paid),
            icon: <CheckCircle2 size={18} />,
            color: "emerald",
            tab: "bills"
          },
        ].map((card, index) => (
          <div
            key={index}
            onClick={() => onNavigate(card.tab)}
            className="bg-surface border border-border rounded-2xl p-5 cursor-pointer hover:shadow-md transition"
          >
            <div className="flex justify-between">
              <div className="h-10 w-10 rounded-xl bg-bg-app flex items-center justify-center text-text-primary">
                {card.icon}
              </div>
              <ArrowUpRight size={14} className="text-success" />
            </div>
            <div className="mt-4">
              <p className="text-[10px] uppercase font-bold text-text-secondary">
                {card.title}
              </p>
              <h2 className="text-2xl font-black text-text-primary mt-1">
                {card.value}
              </h2>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h3 className="font-bold text-sm">Leads Overview</h3>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={80}
                >
                  {donutData.map((item, index) => (
                    <Cell key={index} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          <h3 className="font-bold text-sm">Lead Flow</h3>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="New Leads" stroke="#0A0A0A" />
                <Line type="monotone" dataKey="Interested Leads" stroke="#10B981" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          <h3 className="font-bold text-sm">Expense Overview</h3>
          <h2 className="text-2xl font-black mt-3">
            {formatINR(totalExpensesSum)}
          </h2>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#0A0A0A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold text-sm">Recent Projects</h3>
            <button
              onClick={() => onNavigate("projects")}
              className="text-xs text-primary font-bold flex items-center"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-secondary border-b border-border">
                <th className="text-left py-2">Name</th>
                <th>Status</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecentProjects.slice(0, 5).map((p) => (
                <tr key={p.id} className="border-b border-border">
                  <td className="py-3 font-bold">{p.project_name || "-"}</td>
                  <td>
                    <span className="px-2 py-1 rounded-full bg-bg-app text-[10px]">
                      {p.status || "Pending"}
                    </span>
                  </td>
                  <td>{0}%</td>
                </tr>
              ))}
              {filteredRecentProjects.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center text-text-secondary text-[10px]">No projects found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold text-sm">Recent Bills</h3>
            <button
              onClick={() => onNavigate("bills")}
              className="text-xs text-primary font-bold"
            >
              View All
            </button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-secondary border-b border-border">
                <th className="text-left py-2">Vendor</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecentBills.slice(0, 5).map((b) => (
                <tr key={b.id} className="border-b border-border">
                  <td className="py-3 font-bold">{b.vendor_name || b.vendor || "-"}</td>
                  <td>{formatINR(b.amount || 0)}</td>
                </tr>
              ))}
              {filteredRecentBills.length === 0 && (
                <tr><td colSpan={2} className="py-4 text-center text-text-secondary text-[10px]">No bills found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold text-sm">Recent Activity</h3>
            <span className="text-[10px] bg-success/5 text-success px-2 py-1 rounded-full">LIVE</span>
          </div>
          <div className="space-y-4">
            {filteredActivities.length > 0 ? (
              filteredActivities.slice(0, 5).map((log, index) => (
                <div key={index} className="flex gap-3 text-xs">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-bold">{log.action || "Activity Updated"}</p>
                    <p className="text-text-secondary">{log.created_at || ""}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary">No activity found</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-xl bg-success/5 text-success flex items-center justify-center">
              <MessageCircle size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold">WhatsApp Business API</h4>
              <p className="text-[10px] text-success font-bold mt-1">Connected</p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold">AI Agent</h4>
              <p className="text-[10px] text-primary font-bold mt-1">GPT Integration Active</p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
              <Server size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold">Database</h4>
              <p className="text-[10px] text-primary font-bold mt-1">Supabase Connected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
