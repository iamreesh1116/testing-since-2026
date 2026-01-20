import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Lock, Leaf, Bike, Zap, Droplets, Recycle, Flame, Star, Award, Heart, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const allBadges = [
  { id: "first_step", name: "First Step", description: "Log your first eco activity", icon: Leaf, color: "from-emerald-400 to-green-500", requirement: 1, type: "activities" },
  { id: "eco_warrior", name: "Eco Warrior", description: "Log 10 activities", icon: Award, color: "from-violet-400 to-purple-500", requirement: 10, type: "activities" },
  { id: "planet_hero", name: "Planet Hero", description: "Log 50 activities", icon: Globe, color: "from-sky-400 to-blue-500", requirement: 50, type: "activities" },
  { id: "carbon_cutter", name: "Carbon Cutter", description: "Save 10kg of CO₂", icon: Recycle, color: "from-teal-400 to-emerald-500", requirement: 10, type: "carbon" },
  { id: "climate_champion", name: "Climate Champion", description: "Save 50kg of CO₂", icon: Star, color: "from-amber-400 to-orange-500", requirement: 50, type: "carbon" },
  { id: "green_cyclist", name: "Green Cyclist", description: "Log 5 transport activities", icon: Bike, color: "from-cyan-400 to-sky-500", requirement: 5, type: "transport" },
  { id: "energy_saver", name: "Energy Saver", description: "Log 5 energy activities", icon: Zap, color: "from-yellow-400 to-amber-500", requirement: 5, type: "energy" },
  { id: "water_wise", name: "Water Wise", description: "Log 5 water activities", icon: Droplets, color: "from-blue-400 to-indigo-500", requirement: 5, type: "water" },
  { id: "streak_starter", name: "Streak Starter", description: "Maintain a 3-day streak", icon: Flame, color: "from-orange-400 to-red-500", requirement: 3, type: "streak" },
  { id: "consistency_king", name: "Consistency King", description: "Maintain a 7-day streak", icon: Heart, color: "from-rose-400 to-pink-500", requirement: 7, type: "streak" },
  { id: "level_up", name: "Level Up", description: "Reach level 5", icon: Trophy, color: "from-indigo-400 to-violet-500", requirement: 5, type: "level" },
  { id: "points_master", name: "Points Master", description: "Earn 500 points", icon: Star, color: "from-fuchsia-400 to-purple-500", requirement: 500, type: "points" }
];

export default function Badges() {
  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const stats = await base44.entities.UserStats.list();
      return stats[0] || {};
    }
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.EcoActivity.list()
  });

  // Calculate badge progress
  const getBadgeProgress = (badge) => {
    switch (badge.type) {
      case "activities":
        return userStats?.activities_count || 0;
      case "carbon":
        return userStats?.total_carbon_saved || 0;
      case "transport":
        return activities.filter(a => a.activity_type === "transport").length;
      case "energy":
        return activities.filter(a => a.activity_type === "energy").length;
      case "water":
        return activities.filter(a => a.activity_type === "water").length;
      case "streak":
        return userStats?.longest_streak || userStats?.current_streak || 0;
      case "level":
        return userStats?.level || 1;
      case "points":
        return userStats?.total_points || 0;
      default:
        return 0;
    }
  };

  const badgesWithProgress = allBadges.map(badge => ({
    ...badge,
    progress: getBadgeProgress(badge),
    unlocked: getBadgeProgress(badge) >= badge.requirement
  }));

  const unlockedCount = badgesWithProgress.filter(b => b.unlocked).length;

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Badges</h1>
              <p className="text-gray-500 text-sm">Earn badges for your achievements</p>
            </div>
          </div>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 mb-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm mb-1">Badges Earned</p>
              <p className="text-4xl font-bold">{unlockedCount}</p>
              <p className="text-amber-100 text-sm mt-1">of {allBadges.length} badges</p>
            </div>
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Badges Grid */}
        <div className="grid grid-cols-3 gap-4">
          {badgesWithProgress.map((badge, idx) => {
            const Icon = badge.icon;
            const progressPercent = Math.min((badge.progress / badge.requirement) * 100, 100);
            
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "relative flex flex-col items-center p-4 rounded-2xl border transition-all",
                  badge.unlocked 
                    ? "bg-white border-gray-200 shadow-sm" 
                    : "bg-gray-50 border-gray-100"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-3 relative",
                  badge.unlocked 
                    ? `bg-gradient-to-br ${badge.color}` 
                    : "bg-gray-200"
                )}>
                  {badge.unlocked ? (
                    <Icon className="w-7 h-7 text-white" />
                  ) : (
                    <>
                      <Icon className="w-7 h-7 text-gray-400" />
                      <div className="absolute inset-0 bg-gray-200/60 rounded-2xl flex items-center justify-center">
                        <Lock className="w-4 h-4 text-gray-500" />
                      </div>
                    </>
                  )}
                </div>
                
                <h3 className={cn(
                  "text-xs font-semibold text-center mb-1",
                  badge.unlocked ? "text-gray-900" : "text-gray-400"
                )}>
                  {badge.name}
                </h3>
                
                {!badge.unlocked && (
                  <div className="w-full mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-gray-400 rounded-full h-1 transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 text-center mt-1">
                      {badge.progress}/{badge.requirement}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
