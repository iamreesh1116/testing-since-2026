import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Leaf, Flame, Zap, Award } from "lucide-react";
import { toast } from "sonner";

import StatsCard from "@/components/dashboard/StatsCard";
import ChallengeCard from "@/components/dashboard/ChallengeCard";
import ImpactChart from "@/components/dashboard/ImpactChart";
import QuickActions from "@/components/dashboard/QuickActions";
import LogActivityModal from "@/components/activity/LogActivityModal";

const defaultChallenges = [
  { title: "Meatless Monday", description: "Have a plant-based meal today", category: "food", points: 20, carbon_impact: 2.5, difficulty: "easy" },
  { title: "Power Down Hour", description: "Unplug all non-essential electronics for an hour", category: "energy", points: 15, carbon_impact: 0.5, difficulty: "easy" },
  { title: "Zero Waste Walk", description: "Walk instead of driving for a short trip", category: "transport", points: 25, carbon_impact: 2.0, difficulty: "medium" },
  { title: "Plastic-Free Shopping", description: "Do your grocery shopping without single-use plastics", category: "shopping", points: 30, carbon_impact: 1.0, difficulty: "hard" }
];

export default function Home() {
  const [showLogModal, setShowLogModal] = useState(false);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.EcoActivity.list('-date', 50)
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const existing = await base44.entities.DailyChallenge.list();
      if (existing.length === 0) {
        await base44.entities.DailyChallenge.bulkCreate(defaultChallenges);
        return defaultChallenges;
      }
      return existing;
    }
  });

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const stats = await base44.entities.UserStats.list();
      if (stats.length === 0) {
        const newStats = await base44.entities.UserStats.create({
          total_points: 0,
          total_carbon_saved: 0,
          current_streak: 0,
          longest_streak: 0,
          level: 1,
          activities_count: 0,
          badges_earned: []
        });
        return newStats;
      }
      return stats[0];
    }
  });

  const createActivity = useMutation({
    mutationFn: (data) => base44.entities.EcoActivity.create(data),
    onSuccess: async (newActivity) => {
      queryClient.invalidateQueries(['activities']);
      
      // Update user stats
      if (userStats) {
        const newTotalPoints = (userStats.total_points || 0) + (newActivity.points_earned || 0);
        const newTotalCarbon = (userStats.total_carbon_saved || 0) + (newActivity.carbon_saved || 0);
        const newCount = (userStats.activities_count || 0) + 1;
        const newLevel = Math.floor(newTotalPoints / 100) + 1;
        
        await base44.entities.UserStats.update(userStats.id, {
          total_points: newTotalPoints,
          total_carbon_saved: newTotalCarbon,
          activities_count: newCount,
          level: newLevel
        });
        queryClient.invalidateQueries(['userStats']);
      }
      
      toast.success("Activity logged! 🌿", {
        description: `You earned ${newActivity.points_earned} points!`
      });
    }
  });

  const completeChallenge = useMutation({
    mutationFn: async (challenge) => {
      // Create activity from challenge
      await base44.entities.EcoActivity.create({
        activity_type: challenge.category,
        action: challenge.title,
        carbon_saved: challenge.carbon_impact || 0,
        points_earned: challenge.points,
        date: new Date().toISOString().split('T')[0]
      });
      
      // Mark challenge as completed
      return base44.entities.DailyChallenge.update(challenge.id, {
        completed: true,
        completed_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: async (_, challenge) => {
      queryClient.invalidateQueries(['challenges']);
      queryClient.invalidateQueries(['activities']);
      
      if (userStats) {
        const newTotalPoints = (userStats.total_points || 0) + (challenge.points || 0);
        const newTotalCarbon = (userStats.total_carbon_saved || 0) + (challenge.carbon_impact || 0);
        const newCount = (userStats.activities_count || 0) + 1;
        const newLevel = Math.floor(newTotalPoints / 100) + 1;
        
        await base44.entities.UserStats.update(userStats.id, {
          total_points: newTotalPoints,
          total_carbon_saved: newTotalCarbon,
          activities_count: newCount,
          level: newLevel
        });
        queryClient.invalidateQueries(['userStats']);
      }
      
      toast.success("Challenge completed! 🎉", {
        description: `You earned ${challenge.points} points!`
      });
    }
  });

  const todaysChallenges = challenges.slice(0, 4);
  const stats = userStats || { total_points: 0, total_carbon_saved: 0, current_streak: 0, level: 1 };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900">
            Hello{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-gray-500 mt-1">Let's make today sustainable</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatsCard
            icon={Leaf}
            label="CO₂ Saved"
            value={`${stats.total_carbon_saved?.toFixed(1) || 0}kg`}
            color="green"
            delay={0}
          />
          <StatsCard
            icon={Zap}
            label="Points"
            value={stats.total_points || 0}
            subtext={`Level ${stats.level || 1}`}
            color="amber"
            delay={0.1}
          />
          <StatsCard
            icon={Flame}
            label="Streak"
            value={`${stats.current_streak || 0} days`}
            color="purple"
            delay={0.2}
          />
          <StatsCard
            icon={Award}
            label="Activities"
            value={stats.activities_count || 0}
            color="blue"
            delay={0.3}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <QuickActions onLogActivity={() => setShowLogModal(true)} />
        </div>

        {/* Impact Chart */}
        <div className="mb-8">
          <ImpactChart activities={activities} />
        </div>

        {/* Today's Challenges */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today's Challenges</h2>
            <span className="text-sm text-emerald-600 font-medium">
              {todaysChallenges.filter(c => c.completed).length}/{todaysChallenges.length} done
            </span>
          </div>
          <div className="space-y-3">
            {todaysChallenges.map((challenge, idx) => (
              <ChallengeCard
                key={challenge.id || idx}
                challenge={challenge}
                index={idx}
                onComplete={(c) => completeChallenge.mutate(c)}
              />
            ))}
          </div>
        </div>
      </div>

      <LogActivityModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSubmit={(data) => createActivity.mutate(data)}
      />
    </div>
  );
}
