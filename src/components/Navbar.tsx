
// ─── src/components/Navbar.tsx ──────────────────────────────
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CloudRain, BarChart2, Sliders, Sun } from "lucide-react";

const links = [
  { href: "/dashboard",      label: "Dashboard",      icon: Sun },
  { href: "/visualizations", label: "Visualizations", icon: BarChart2 },
  { href: "/predictions",    label: "Predictions",    icon: Sliders },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-8 h-16">
        <div className="flex items-center gap-2 text-blue-600 font-semibold text-lg">
          <CloudRain size={22} />
          <span>Mumbai Weather</span>
        </div>
        <div className="flex gap-1 ml-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = path.startsWith(href);
            return (
              <Link key={href} href={href}>
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${active
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}
                >
                  <Icon size={15} />
                  {label}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

