import { ReactNode, MouseEvent } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  animate?: boolean;
  onClick?: (e?: MouseEvent<HTMLDivElement>) => void;
}

export function Card({
  children,
  className = "",
  hover = false,
  animate = true,
  onClick,
}: CardProps) {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-2xl p-6 card-shadow
        transition-all duration-300 ease-out
        ${hover ? "hover:card-shadow-hover hover:-translate-y-1" : ""}
        ${animate ? "animate-fade-in" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "red" | "green" | "blue" | "yellow";
  delay?: number;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "red",
  delay = 0,
}: SummaryCardProps) {
  const colorClasses = {
    red: "from-[#E57373] to-[#C62828]",
    green: "from-emerald-400 to-emerald-600",
    blue: "from-blue-400 to-blue-600",
    yellow: "from-amber-400 to-amber-600",
  };

  const delayClass = delay > 0 ? `animation-delay-${delay}` : "";

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-2xl p-6 card-shadow relative overflow-hidden
        transition-all duration-300 ease-out
        hover:card-shadow-hover hover:-translate-y-1
        animate-fade-in-up opacity-0
        ${delayClass}
      `}
      style={{ animationFillMode: "forwards", animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <div
              className={`flex items-center gap-1 mt-2 text-sm ${
                trend.isPositive ? "text-emerald-500" : "text-red-500"
              }`}
            >
              <span className="transition-transform duration-300">
                {trend.isPositive ? "↑" : "↓"}
              </span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-gray-400 dark:text-gray-500">
                dari bulan lalu
              </span>
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white shadow-lg transition-transform duration-300 hover:scale-110`}
        >
          {icon}
        </div>
      </div>

      {/* Decorative element */}
      <div
        className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-gradient-to-br ${colorClasses[color]} opacity-10 dark:opacity-20 transition-transform duration-500 hover:scale-150`}
      />
    </div>
  );
}
