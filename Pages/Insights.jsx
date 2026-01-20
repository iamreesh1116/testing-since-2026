import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Leaf, Calendar, Bike, Zap, Recycle, Droplets, ShoppingBag } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

const categoryIcons = {
  transport: Bike,
  food: Leaf,
  energy: Zap,
  waste: Recycle,
  water: Droplets,
  shopping: ShoppingBag
};

const categoryColors = {
  transport: "#0ea5e9",
  food: "#10b981",
  energy: "#f59e0b",
  waste: "#8b5cf6",
  water: "#3b82f6",
  shopping: "#f43f5e"
};

export default function Insights() {
  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.EcoActivity.list('-date', 100)
  });

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const stats = await base44.entities.UserStats.list();
      return stats[0] || {};
    }
  });

  // Process data for charts
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayActivities = activities.filter(a => a.date === dateStr);
    return {
      date: dateStr,
      label: format(date, 'EEE'),
      carbon: dayActivities.reduce((sum, a) => sum + (a.carbon_saved || 0), 0),
      points: dayActivities.reduce((sum, a) => sum + (a.points_earned || 0), 0),
      count: dayActivities.length
    };
  });

  // Category breakdown
  const categoryData = Object.entries(
    activities.reduce((acc, a) => {
      acc[a.activity_type] = (acc[a.activity_type] || 0) + (a.carbon_saved || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: parseFloat(value.toFixed(1)),
    color: categoryColors[name]
  })).filter(d => d.value > 0);

  const totalCarbonWeek = last7Days.reduce((sum, d) => sum + d.carbon, 0);
  const totalPointsWeek = last7Days.reduce((sum, d) => sum + d.points, 0);
  const avgDaily = totalCarbonWeek / 7;

  // Top activities
  const activityCounts = activities.reduce((acc, a) => {
    acc[a.action] = (acc[a.action] || 0) + 1;
    return acc;
  }, {});
  const topActivities = Object.entries(activityCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
              <p className="text-gray-500 text-sm">Your sustainability journey</p>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 border border-gray-100"
          >
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <Leaf className="w-4 h-4" />
              <span className="text-xs font-medium">This Week</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalCarbonWeek.toFixed(1)}kg</p>
            <p className="text-xs text-gray-500">CO₂ saved</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 border border-gray-100"
          >
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Daily Avg</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{avgDaily.toFixed(1)}kg</p>
            <p className="text-xs text-gray-500">CO₂ per day</p>
          </motion.div>
        </div>

        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-gray-100 mb-6"
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Weekly Carbon Saved</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <XAxis 
                  dataKey="label" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => [`${value.toFixed(1)} kg`, 'CO₂ Saved']}
                />
                <Bar 
                  dataKey="carbon" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 mb-6"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Impact by Category</h3>
            <div className="flex items-center gap-6">
              <div className="w-28 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {categoryData.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-gray-600">{cat.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{cat.value}kg</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Top Activities */}
        {topActivities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-5 border border-gray-100"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Your Top Activities</h3>
            <div className="space-y-3">
              {topActivities.map(([action, count], idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm">
                      {idx + 1}
                    </div>
                    <span className="text-gray-700 text-sm">{action}</span>
                  </div>
                  <span className="text-gray-400 text-sm">{count}x</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activities.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">Log activities to see your insights</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
