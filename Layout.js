Layout.js
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Target, BarChart3, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Home", icon: Home, page: "Home" },
  { name: "Challenges", icon: Target, page: "Challenges" },
  { name: "Insights", icon: BarChart3, page: "Insights" },
  { name: "Badges", icon: Trophy, page: "Badges" }
];

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 safe-area-inset-bottom z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                  isActive 
                    ? "text-emerald-600" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <item.icon className={cn(
                  "w-6 h-6 transition-all",
                  isActive && "scale-110"
                )} />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
Add Layout
}
