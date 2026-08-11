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


interface DashboardProps {
  onNavigate: (tab: string) => void;
  openChat: () => void;
}


interface DashboardData {
  projects: number;
  customers: number;
  leads: number;
  bills: number;
  expenses: number;
  revenue: number;

  recentProjects?: Project[];
  recentBills?: Bill[];
  activities?: ActivityLog[];
}



export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  openChat,
}) => {


  const [loading,setLoading] = useState(true);


  const [dashboardData,setDashboardData] =
  useState<DashboardData>({
    projects:0,
    customers:0,
    leads:0,
    bills:0,
    expenses:0,
    revenue:0,
    recentProjects:[],
    recentBills:[],
    activities:[]
  });



  const [projects,setProjects] =
  useState<Project[]>([]);


  const [bills,setBills] =
  useState<Bill[]>([]);


  const [siteVisits,setSiteVisits] =
  useState<SiteVisit[]>([]);


  const [activityLogs,setActivityLogs] =
  useState<ActivityLog[]>([]);



  // =========================
  // LOAD DASHBOARD DATA
  // =========================

  useEffect(()=>{


    const loadDashboard = async()=>{


      try{


        const response =
        await apiClient.get("/dashboard");


        console.log(
          "DASHBOARD RESPONSE:",
          response.data
        );


        const data =
        response.data.data;



        setDashboardData({

          projects:
          data.projects ??
          data.totalProjects ??
          0,


          customers:
          data.customers ??
          data.totalCustomers ??
          0,


          leads:
          data.leads ??
          data.totalLeads ??
          0,


          bills:
          data.bills ??
          data.totalBills ??
          0,


          expenses:
          data.expenses ??
          data.totalExpenses ??
          0,


          revenue:
          data.revenue ??
          data.totalRevenue ??
          0,


          recentProjects:
          data.recentProjects ?? [],


          recentBills:
          data.recentBills ?? [],


          activities:
          data.activities ?? []

        });



        setProjects(
          data.recentProjects ?? []
        );


        setBills(
          data.recentBills ?? []
        );


        setActivityLogs(
          data.activities ?? []
        );



      }
      catch(error){

        console.error(
          "Dashboard Error:",
          error
        );

      }
      finally{

        setLoading(false);

      }


    };


    loadDashboard();


  },[]);




  // =========================
  // HELPERS
  // =========================


  const formatINR=(value:number)=>{


    if(!value)
      return "₹ 0";


    if(value >= 10000000){

      return (
        `₹ ${(value/10000000)
        .toFixed(2)} Cr`
      );

    }


    if(value >=100000){

      return (
        `₹ ${(value/100000)
        .toFixed(2)} L`
      );

    }


    return (
      `₹ ${value.toLocaleString("en-IN")}`
    );

  };



  const today =
  new Date()
  .toISOString()
  .split("T")[0];



  // =========================
  // KPI VALUES
  // =========================


  const totalProjectsVal =
  dashboardData.projects;



  const ongoingProjectsVal =
  projects.filter(
    p =>
    p.status === "Ongoing"
  ).length;



  const completedProjectsVal =
  projects.filter(
    p =>
    p.status === "Completed"
  ).length;



  const totalCustomersVal =
  dashboardData.customers;



  const activeLeadsVal =
  dashboardData.leads;



  const todaysSiteVisitsVal =
  siteVisits.filter(
    v =>
    v.visit_date === today
  ).length;



  const totalExpensesSum =
  dashboardData.expenses;



  const totalRevenueVal =
  dashboardData.revenue;



  const pendingUpdatesVal =
  projects.filter(
    p =>
    (p.progress ?? 0) < 100
  ).length;



  const billsUploadedVal =
  dashboardData.bills;



  if(loading){

    return (
      <div className="flex justify-center items-center h-96">

        <p className="font-bold text-slate-500">
          Loading Dashboard...
        </p>

      </div>
    );

  }
    // =========================
  // CHART DATA
  // =========================


  const donutData = [
    {
      name:"New Leads",
      value:45,
      color:"#3b82f6"
    },
    {
      name:"Interested",
      value:48,
      color:"#eab308"
    },
    {
      name:"Site Visit",
      value:15,
      color:"#10b981"
    },
    {
      name:"Not Interested",
      value:15,
      color:"#94a3b8"
    }
  ];



  const lineData = [
    {
      name:"01 May",
      "New Leads":20,
      "Interested Leads":12
    },
    {
      name:"07 May",
      "New Leads":28,
      "Interested Leads":18
    },
    {
      name:"14 May",
      "New Leads":35,
      "Interested Leads":24
    },
    {
      name:"21 May",
      "New Leads":42,
      "Interested Leads":31
    },
    {
      name:"28 May",
      "New Leads":50,
      "Interested Leads":38
    }
  ];



  const barData = [
    {
      name:"Cement",
      amount:125000
    },
    {
      name:"Steel",
      amount:425000
    },
    {
      name:"Labour",
      amount:85000
    },
    {
      name:"Other",
      amount:45000
    }
  ];




return (

<div className="space-y-8 font-sans">


{/* =========================
 KPI CARDS
========================= */}


<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">



{/* CARD */}

{[
{
title:"Total Projects",
value:totalProjectsVal,
icon:<Building2 size={18}/>,
color:"blue",
tab:"projects"
},

{
title:"Ongoing Projects",
value:ongoingProjectsVal,
icon:<Layers size={18}/>,
color:"amber",
tab:"projects"
},

{
title:"Completed Projects",
value:completedProjectsVal,
icon:<CheckCircle2 size={18}/>,
color:"emerald",
tab:"projects"
},

{
title:"Customers",
value:totalCustomersVal,
icon:<Users size={18}/>,
color:"indigo",
tab:"customers"
},

{
title:"Active Leads",
value:activeLeadsVal,
icon:<Briefcase size={18}/>,
color:"rose",
tab:"leads"
},

{
title:"Today's Visits",
value:todaysSiteVisitsVal,
icon:<Calendar size={18}/>,
color:"purple",
tab:"site_visits"
},

{
title:"Revenue",
value:formatINR(totalRevenueVal),
icon:<DollarSign size={18}/>,
color:"emerald",
tab:"reports"
},

{
title:"Delivered",
value:completedProjectsVal,
icon:<CheckCircle2 size={18}/>,
color:"cyan",
tab:"projects"
},

{
title:"Pending Updates",
value:pendingUpdatesVal,
icon:<AlertTriangle size={18}/>,
color:"amber",
tab:"projects"
},

{
title:"Bills Uploaded",
value:billsUploadedVal,
icon:<Receipt size={18}/>,
color:"violet",
tab:"bills"
}

].map((card,index)=>(


<div

key={index}

onClick={()=>onNavigate(card.tab)}

className="
bg-white
border
border-slate-200
rounded-2xl
p-5
cursor-pointer
hover:shadow-md
transition
"

>


<div className="flex justify-between">


<div
className="
h-10
w-10
rounded-xl
bg-slate-100
flex
items-center
justify-center
text-slate-700
"
>

{card.icon}

</div>



<ArrowUpRight
size={14}
className="text-emerald-500"
/>


</div>



<div className="mt-4">


<p
className="
text-[10px]
uppercase
font-bold
text-slate-400
"
>

{card.title}

</p>


<h2
className="
text-2xl
font-black
text-slate-800
mt-1
"
>

{card.value}

</h2>


</div>


</div>


))}



</div>





{/* =========================
 CHARTS
========================= */}



<div className="
grid
grid-cols-1
lg:grid-cols-3
gap-6
">



{/* DONUT */}

<div className="
bg-white
border
rounded-2xl
p-6
">


<h3 className="font-bold text-sm">
Leads Overview
</h3>


<div className="h-56 mt-4">


<ResponsiveContainer
width="100%"
height="100%"
>


<PieChart>


<Pie

data={donutData}

dataKey="value"

innerRadius={55}

outerRadius={80}

>

{
donutData.map(
(item,index)=>(

<Cell

key={index}

fill={item.color}

/>

))
}


</Pie>


<Tooltip/>


</PieChart>


</ResponsiveContainer>


</div>


</div>






{/* LINE */}

<div className="
bg-white
border
rounded-2xl
p-6
">


<h3 className="font-bold text-sm">
Lead Flow
</h3>


<div className="h-56 mt-4">


<ResponsiveContainer
width="100%"
height="100%"
>


<LineChart
data={lineData}
>


<CartesianGrid
strokeDasharray="3 3"
/>


<XAxis dataKey="name"/>


<YAxis/>


<Tooltip/>


<Legend/>


<Line

type="monotone"

dataKey="New Leads"

stroke="#3b82f6"

/>


<Line

type="monotone"

dataKey="Interested Leads"

stroke="#10b981"

/>


</LineChart>


</ResponsiveContainer>


</div>


</div>






{/* BAR */}

<div className="
bg-white
border
rounded-2xl
p-6
">


<h3 className="font-bold text-sm">
Expense Overview
</h3>



<h2 className="text-2xl font-black mt-3">

{formatINR(totalExpensesSum)}

</h2>



<div className="h-56 mt-4">


<ResponsiveContainer
width="100%"
height="100%"
>


<BarChart
data={barData}
>


<CartesianGrid
strokeDasharray="3 3"
/>


<XAxis dataKey="name"/>


<YAxis/>


<Tooltip/>


<Bar

dataKey="amount"

fill="#ec4899"

/>


</BarChart>


</ResponsiveContainer>


</div>


</div>



</div>
{/* =========================
 LOWER SECTION
========================= */}


<div className="
grid
grid-cols-1
lg:grid-cols-3
gap-6
">



{/* RECENT PROJECTS */}

<div className="
bg-white
border
rounded-2xl
p-6
">


<div className="flex justify-between mb-4">

<h3 className="font-bold text-sm">
Recent Projects
</h3>


<button

onClick={()=>onNavigate("projects")}

className="
text-xs
text-blue-600
font-bold
flex
items-center
"

>

View All

<ChevronRight size={14}/>

</button>


</div>




<table className="w-full text-xs">


<thead>

<tr className="text-slate-400 border-b">

<th className="text-left py-2">
Name
</th>

<th>
Status
</th>

<th>
Progress
</th>


</tr>


</thead>



<tbody>


{projects
.slice(0,5)
.map((p)=>(


<tr
key={p.id}
className="border-b"
>


<td className="py-3 font-bold">


{p.project_name || "-"}


</td>



<td>


<span className="px-2 py-1 rounded-full bg-slate-100 text-[10px]">


{p.status || "Pending"}


</span>


</td>



<td>


{p.progress ?? 0}%


</td>



</tr>


))}



</tbody>


</table>


</div>








{/* RECENT BILLS */}



<div className="
bg-white
border
rounded-2xl
p-6
">


<div className="flex justify-between mb-4">


<h3 className="font-bold text-sm">
Recent Bills
</h3>


<button

onClick={()=>onNavigate("bills")}

className="
text-xs
text-blue-600
font-bold
"

>

View All

</button>


</div>




<table className="w-full text-xs">


<thead>

<tr className="text-slate-400 border-b">


<th className="text-left py-2">
Vendor
</th>


<th>
Amount
</th>


</tr>


</thead>



<tbody>



{bills
.slice(0,5)
.map((b)=>(



<tr
key={b.id}
className="border-b"
>



<td className="py-3 font-bold">


{b.vendor || "-"}


</td>




<td>


{formatINR(
b.amount || 0
)}


</td>



</tr>



))}



</tbody>


</table>


</div>








{/* ACTIVITY LOG */}



<div className="
bg-white
border
rounded-2xl
p-6
">


<div className="flex justify-between mb-4">


<h3 className="font-bold text-sm">
Recent Activity
</h3>


<span className="
text-[10px]
bg-green-50
text-green-600
px-2
py-1
rounded-full
">

LIVE

</span>


</div>





<div className="space-y-4">



{activityLogs.length > 0 ?


activityLogs
.slice(0,5)
.map((log,index)=>(


<div

key={index}

className="
flex
gap-3
text-xs
"


>


<div className="
h-2
w-2
rounded-full
bg-blue-500
mt-2
"/>


<div>


<p className="font-bold">

{log.action || "Activity Updated"}

</p>


<p className="text-slate-400">

{log.created_at || ""}

</p>


</div>



</div>


))


:


<p className="text-sm text-slate-400">
No activity found
</p>



}




</div>


</div>



</div>








{/* =========================
 SYSTEM STATUS
========================= */}



<div className="
grid
grid-cols-1
md:grid-cols-3
gap-6
">






{/* WHATSAPP */}


<div className="
bg-white
border
rounded-2xl
p-5
">


<div className="flex gap-3">


<div className="
h-10
w-10
rounded-xl
bg-green-50
text-green-600
flex
items-center
justify-center
">


<MessageCircle size={20}/>


</div>



<div>


<h4 className="text-xs font-bold">

WhatsApp Business API

</h4>



<p className="
text-[10px]
text-green-600
font-bold
mt-1
">

Connected

</p>


</div>


</div>


</div>








{/* AI */}


<div className="
bg-white
border
rounded-2xl
p-5
">


<div className="flex gap-3">


<div className="
h-10
w-10
rounded-xl
bg-blue-50
text-blue-600
flex
items-center
justify-center
">


<Sparkles size={20}/>


</div>



<div>


<h4 className="text-xs font-bold">

AI Agent

</h4>


<p className="
text-[10px]
text-blue-600
font-bold
mt-1
">

GPT Integration Active

</p>


</div>



</div>


</div>








{/* DATABASE */}



<div className="
bg-white
border
rounded-2xl
p-5
">


<div className="flex gap-3">


<div className="
h-10
w-10
rounded-xl
bg-indigo-50
text-indigo-600
flex
items-center
justify-center
">


<Server size={20}/>


</div>



<div>


<h4 className="text-xs font-bold">

Database

</h4>



<p className="
text-[10px]
text-indigo-600
font-bold
mt-1
">

Supabase Connected

</p>



</div>



</div>


</div>





</div>





</div>

);

};