"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { differenceInCalendarDays, differenceInCalendarWeeks } from "date-fns";
import { formatDate, secondsUntil } from "@/lib/utils";

function useCountdown(target: string) {
  const [seconds, setSeconds] = useState(() => secondsUntil(target));
  useEffect(() => {
    const id = setInterval(() => setSeconds(secondsUntil(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return { days, hours, minutes, secs };
}

export function CountdownHero({
  weddingDate,
  planningStartDate,
  coupleNames,
}: {
  weddingDate: string;
  planningStartDate: string;
  coupleNames: string;
}) {
  const { days, hours, minutes, secs } = useCountdown(weddingDate);
  const weeksRemaining = Math.max(0, differenceInCalendarWeeks(new Date(weddingDate), new Date()));

  const totalPlanningDays = Math.max(
    1,
    differenceInCalendarDays(new Date(weddingDate), new Date(planningStartDate))
  );
  const elapsedDays = Math.min(
    totalPlanningDays,
    Math.max(0, differenceInCalendarDays(new Date(), new Date(planningStartDate)))
  );
  const percentElapsed = Math.round((elapsedDays / totalPlanningDays) * 100);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentElapsed / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-nikah-gradient p-6 text-white shadow-soft-lg sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.18),transparent_45%)]" />
      <div className="relative flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-white/70">
            {formatDate(weddingDate, "EEEE, d MMMM yyyy")}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">{coupleNames}</h1>
          <p className="mt-1 text-sm text-white/75">{weeksRemaining} weeks to go</p>

          <div className="mt-6 flex gap-3 sm:gap-4">
            {[
              { label: "Days", value: days },
              { label: "Hours", value: hours },
              { label: "Min", value: minutes },
              { label: "Sec", value: secs },
            ].map((unit) => (
              <motion.div
                key={unit.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex w-16 flex-col items-center rounded-xl bg-white/15 py-3 backdrop-blur"
              >
                <span className="font-display text-2xl font-semibold tabular-nums sm:text-3xl">
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="text-[11px] uppercase tracking-wide text-white/70">{unit.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative flex h-[140px] w-[140px] shrink-0 items-center justify-center">
          <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="url(#goldGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f5ebc9" />
                <stop offset="100%" stopColor="#dba93a" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-semibold">{percentElapsed}%</span>
            <span className="px-4 text-center text-[11px] uppercase tracking-wide text-white/70">planning used</span>
          </div>
        </div>
      </div>
    </div>
  );
}
