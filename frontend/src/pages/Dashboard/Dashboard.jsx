// Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart, Pie, Cell,
  Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
  Tooltip,
} from "recharts";
import {
  Wrench, Users, Package as PackageIcon, Settings,
} from "lucide-react";

const API_BASE = "http://localhost:5000/api";

const COLORS = {
  healthy: "#16a34a",
  unhealthy: "#ef4444",
  completed: "#3b82f6",
  pending: "#f59e0b",
  inventory: ["#a78bfa", "#60a5fa", "#34d399", "#f97316", "#f472b6"],
  gaugeGood: "#16a34a",
  gaugeWarn: "#f59e0b",
  gaugeBad: "#ef4444",
};

// Fetch with optional params for server-side filtering
async function fetchWithParams(endpoint, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE}/${endpoint}${query ? `?${query}` : ""}`;
  const res = await axios.get(url);
  return res.data;
}

export default function Dashboard() {
  const [dark] = useState(false);
  const [machines, setMachines] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Local filters
  const [techSelector] = useState("");
  const [trendFrom] = useState("");
  const [trendTo] = useState("");
  const [inventoryCategory] = useState("");
  const [showLowStockOnly] = useState(false);
  const [gaugeThreshold, setGaugeThreshold] = useState(15);

  const expiryData = useMemo(() => {
  const today = new Date();
  let expiringSoon = 0;
  let expired = 0;

  inventory.forEach(i => {
    if (!i.expiry) return;
    const expiryDate = new Date(i.expiry);
    const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) expired++;
    else if (diffDays <= 7) expiringSoon++;
  });

  return { expiringSoon, expired };
}, [inventory]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [machinesData, techsData, invData, logsData] = await Promise.all([
          fetchWithParams("machines"),
          fetchWithParams("technicians"),
          fetchWithParams("inventory", {
            category: inventoryCategory,
            lowStockOnly: showLowStockOnly,
          }),
          fetchWithParams("logs", {
            from: trendFrom,
            to: trendTo,
            tech_id: techSelector,
          }),
        ]);
        setMachines(machinesData || []);
        setTechnicians(techsData || []);
        setInventory(invData || []);
        setLogs(logsData || []);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [inventoryCategory, showLowStockOnly, trendFrom, trendTo, techSelector]);

  const totalMachines = machines.length;
  const healthyCount = machines.filter(m => m.status === "Healthy").length;
  const unhealthyCount = machines.filter(m => m.status === "Unhealthy").length;
  const totalTechs = technicians.length;
  const totalInventoryItems = inventory.length;
  const totalLogs = logs.length;
  const lowStockCount = useMemo(() => inventory.filter(i => i.quantity < 10).length, [inventory]);

  // Machine health pie
  const machineHealthPie = useMemo(() => [
    { name: "Healthy", value: healthyCount, color: COLORS.healthy },
    { name: "Unhealthy", value: unhealthyCount, color: COLORS.unhealthy },
  ], [healthyCount, unhealthyCount]);

  // Technician workload
  const techWorkData = useMemo(() => {
    const selected = techSelector ? technicians.filter(t => t.id === techSelector) : technicians;
    return selected.map(t => {
      const techLogs = logs.filter(l => l.tech_id === t.id);
      const completed = techLogs.filter(l => l.completed).length;
      const pending = techLogs.filter(l => !l.completed).length;
      return { name: t.name, completed, pending };
    });
  }, [technicians, logs, techSelector]);

  // Maintenance trend
  const maintenanceTrendData = useMemo(() => {
    const map = {};
    logs.forEach(l => {
      if (!l.date_time) return;
      const dateKey = l.date_time.slice(0, 10);
      map[dateKey] = (map[dateKey] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([date, count]) => ({ date, count }));
  }, [logs]);

  // Inventory category donut
  const inventoryCategoryData = useMemo(() => {
    const map = {};
    inventory.forEach(i => {
      map[i.category] = (map[i.category] || 0) + i.quantity;
    });
    return Object.entries(map).map(([name, value], idx) => ({
      name, value, color: COLORS.inventory[idx % COLORS.inventory.length],
    }));
  }, [inventory]);

  // Stock Alert Gauge
  const gaugeData = useMemo(() => {
    if (!inventory.length) return [];
    const totalSKUs = inventory.length;
    const under = inventory.filter(i => i.quantity <= gaugeThreshold).length;
    const percentUnder = Math.round((under / totalSKUs) * 100);
    const percentOk = 100 - percentUnder;
    const color = percentUnder >= 50
      ? COLORS.gaugeBad
      : percentUnder >= 20
      ? COLORS.gaugeWarn
      : COLORS.gaugeGood;
    return [
      { name: "Under Threshold", value: percentUnder, color },
      { name: "OK", value: percentOk, color: "#e5e7eb" },
    ];
  }, [inventory, gaugeThreshold]);
  const expiryPieData = useMemo(() => [
  { name: "Expired", value: expiryData.expired, color: "#ef4444" },
  { name: "Expiring Soon", value: expiryData.expiringSoon, color: "#f59e0b" },
  { name: "Safe", value: totalInventoryItems - expiryData.expiringSoon - expiryData.expired, color: "#16a34a" }
], [expiryData, totalInventoryItems]);


  return (
    <div className={`min-h-screen transition-colors ${dark ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Wrench className="text-blue-600 dark:text-blue-400" size={30} />
          <div>
            <div className="font-bold text-xl">TexCare360 — Analytics</div>
            <div className="text-sm text-gray-500">Operational insights & real-time gauges</div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-8 space-y-8">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI title="Machines" value={totalMachines} subtitle={`${healthyCount} healthy • ${unhealthyCount} unhealthy`} icon={<Wrench size={20} />} />
          <KPI title="Technicians" value={totalTechs} subtitle={`${totalLogs} total logs`} icon={<Users size={20} />} />
          <KPI title="Inventory Items" value={totalInventoryItems} subtitle={`${lowStockCount} low-stock`} icon={<PackageIcon size={20} />} />
          <KPI title="Maintenance Logs" value={totalLogs} subtitle={`${maintenanceTrendData.length} active days`} icon={<Settings size={20} />} />
          <KPI 
  title="Expiry Alerts"
  value={expiryData.expiringSoon + expiryData.expired}
  subtitle={`${expiryData.expiringSoon} soon • ${expiryData.expired} expired`} 
  icon={<PackageIcon size={20} />}
/>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
          {/* Machine Health */}
          <ChartCard title="Machine Health" legend="Green = Healthy, Red = Unhealthy">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={machineHealthPie} cx="50%" cy="50%" outerRadius={80} label>
                  {machineHealthPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

{/* Technician Workload */}
<ChartCard title="Technician Workload">
  <ResponsiveContainer width="100%" height={260}>
    <BarChart
      data={techWorkData}
      margin={{ top: 10, right: 30, left: 0, bottom: 30 }} // adds padding at bottom
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="name"
        angle={-60}
        textAnchor="end"
        interval={0}
        tick={{ fontSize: 12, dy: 10 }} // dy gives vertical spacing between axis and bars
      />
      <YAxis />
      <Tooltip />
      <Legend verticalAlign="top" height={36} />
      <Bar dataKey="completed" fill={COLORS.completed} />
      <Bar dataKey="pending" fill={COLORS.pending} />
    </BarChart>
  </ResponsiveContainer>
</ChartCard>

          {/* Maintenance Trend */}
          <ChartCard title="Maintenance Trend">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={maintenanceTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }} >
                <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    angle={-60}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 12, dy: 10 }} // dy gives vertical spacing between axis and bars
                  />    
                  <YAxis />
                <Tooltip />
                <Line dataKey="count" stroke={COLORS.completed} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Inventory Distribution */}
<ChartCard title="Inventory by Category">
  <ResponsiveContainer width="100%" height={240}>
    <PieChart>
      <Pie data={inventoryCategoryData} innerRadius={50} outerRadius={80} label>
        {inventoryCategoryData.map((e, i) => (
          <Cell key={i} fill={e.color} />
        ))}
      </Pie>
      <RechartsTooltip />
    </PieChart>
  </ResponsiveContainer>

  {/* Legend Section */}
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '15px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: '12px', height: '12px', backgroundColor: '#5DA0FB', borderRadius: '3px' }}></div>
      <span style={{ fontSize: '13px' }}>Raw Materials</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: '12px', height: '12px', backgroundColor: '#B59CFF', borderRadius: '3px' }}></div>
      <span style={{ fontSize: '13px' }}>Spare Parts</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: '12px', height: '12px', backgroundColor: '#3AE8A5', borderRadius: '3px' }}></div>
      <span style={{ fontSize: '13px' }}>Maintenance Supplies</span>
    </div>
  </div>
</ChartCard>


          {/* Stock Alert Gauge */}
          <ChartCard
            title="Stock Alert Gauge"
            controls={(
              <input
                type="number"
                min={1}
                max={100}
                value={gaugeThreshold}
                onChange={e => setGaugeThreshold(Number(e.target.value))}
                className="w-20 border rounded px-2 py-1 text-sm"
              />
            )}
            legend="Shows Inventory % under the threshold (low-stock)."
          >

            
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie startAngle={180} endAngle={0} data={gaugeData} innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                  {gaugeData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Inventory Expiry Status */}
<ChartCard title="Inventory Expiry Status" legend="Red = Expired, Orange = Expiring Soon, Green = Safe">
  <ResponsiveContainer width="100%" height={240}>
    <PieChart>
      <Pie
        data={expiryPieData}
        dataKey="value"
        innerRadius={50}
        outerRadius={80}
        label
      >
        {expiryPieData.map((e, i) => (
          <Cell key={i} fill={e.color} />
        ))}
      </Pie>
      <RechartsTooltip />
    </PieChart>
  </ResponsiveContainer>

  {/* Legend Section */}
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '15px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '3px' }}></div>
      <span style={{ fontSize: '13px' }}>Expired</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '3px' }}></div>
      <span style={{ fontSize: '13px' }}>Expiring Soon (≤7 days)</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: '12px', height: '12px', backgroundColor: '#16a34a', borderRadius: '3px' }}></div>
      <span style={{ fontSize: '13px' }}>Safe</span>
    </div>
  </div>
</ChartCard>

        </div>

        
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-lg flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <span className="text-lg font-semibold">Loading dashboard...</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Small KPI card component
function KPI({ title, value, subtitle, icon }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex items-start gap-4">
      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">{icon}</div>
      <div className="flex-1">
        <div className="text-xs font-medium text-gray-500">{title}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
        {subtitle && <div className="text-sm text-gray-400 mt-1">{subtitle}</div>}
      </div>
    </motion.div>
  );
}

// Chart Card wrapper
function ChartCard({ title, legend, controls, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold text-lg">{title}</div>
          {legend && <div className="text-xs text-gray-500 mt-1">{legend}</div>}
        </div>
        {controls}
      </div>
      {children}
    </motion.div>
  );
}
