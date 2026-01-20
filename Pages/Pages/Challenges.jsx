import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Filter, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import ChallengeCard from "@/components/dashboard/ChallengeCard";

const categories = [
  { key: "all", label: "All" },
  { key: "transport", label: "Transport" },
  { key: "food", label: "Food" },
  { key: "energy", label: "Energy" },
  { key: "waste", label: "Waste" },
  { key: "water", label: "Water" },
  { key: "shopping", label: "Shopping" }
];

export default function Challenges() {
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.DailyChallenge.list()
  });

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const stats = await base44.entities.UserStats.list();
      return stats[0] || { total_points: 0, total_carbon_saved: 0 };
    }
  });

  const completeChallenge = useMutation({
    mutationFn: async (challenge) => {
      await base44.entities.EcoActivity.create({
        activity_type: challenge.category,
        action: challenge.title,
        carbon_saved: challenge.carbon_impact || 0,
        points_earned: challenge.points,
        date: new Date().toISOString().split('T')[0]
      });
      
      return base44.entities.DailyChallenge.update(challenge.id, {
        completed: true,
        completed_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: async (_, challenge) => {
      queryClient.invalidateQueries(['challenges']);
      queryClient.invalidateQueries(['activities']);
      
      if (userStats) {
        await base44.entities.UserStats.update(userStats.id, {
          total_points: (userStats.total_points || 0) + (challenge.points || 0),
          total_carbon_saved: (userStats.total_carbon_saved || 0) + (challenge.carbon_impact || 0),
          activities_count: (userStats.activities_count || 0) + 1
        });
        queryClient.invalidateQueries(['userStats']);
      }
      
      toast.success("Challenge completed! 🎉");
    }
  });

  const filteredChallenges = filter === "all" 
    ? challenges 
    : challenges.filter(c => c.category === filter);

  const completedCount = challenges.filter(c => c.completed).length;
  const totalPoints = challenges.filter(c => c.completed).reduce((sum, c) => sum + (c.points || 0), 0);

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Challenges</h1>
              <p className="text-gray-500 text-sm">Complete daily eco challenges</p>
            </div>
          </div>
        </motion.div>

        {/* Progress Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 mb-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-violet-100 text-sm">Today's Progress</span>
            <span className="text-white font-bold">{completedCount}/{challenges.length}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${challenges.length > 0 ? (completedCount / challenges.length) * 100 : 0}%` }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-white rounded-full h-2"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-violet-100">Points earned today</span>
            <span className="font-bold">+{totalPoints}</span>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === cat.key
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Challenges List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredChallenges.map((challenge, idx) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                index={idx}
                onComplete={(c) => completeChallenge.mutate(c)}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredChallenges.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No challenges in this category</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
