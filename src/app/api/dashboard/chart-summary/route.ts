import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Dashboard Chart Summary API
 * Provides pre-aggregated data for dashboard charts to reduce payload size
 * from ~5MB (raw data) to ~2KB (aggregated)
 */

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

// Helper to get YYYY-MM-DD string from Date
function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get('year') || new Date().getFullYear().toString()
    );
    const userId = searchParams.get('userId'); // For user-specific stats

    // Date boundaries
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);
    const today = new Date();
    const todayStr = toDateStr(today);
    const todayStart = new Date(todayStr + 'T00:00:00');
    const todayEnd = new Date(todayStr + 'T23:59:59.999');

    // Extended start date for 16-15 filter: include previous month data
    // When currentDay < 16, the 16-15 period starts from previous month's 16th
    const currentMonth = today.getMonth();
    const extendedStart =
      currentMonth === 0
        ? new Date(year - 1, 11, 1) // December of previous year
        : new Date(year, currentMonth - 1, 1); // Previous month

    // Parallel queries for efficiency
    const [
      schedulesByMonth,
      cashByMonth,
      todayAttendance,
      todaySchedules,
      yearCashTotals,
      userYearlyAttendance,
      activeShifts,
      monthlyReportData,
    ] = await Promise.all([
      // 1. Schedule aggregation by month and shift type
      prisma.schedule
        .groupBy({
          by: ['keterangan'],
          where: {
            tanggal: { gte: yearStart, lte: yearEnd },
          },
          _count: { id: true },
        })
        .then(async () => {
          // Get active shift types first
          const shiftTypes = await prisma.shiftSetting.findMany({
            where: { isActive: true },
            select: { shiftType: true },
          });
          const defaultShiftTypes =
            shiftTypes.length > 0
              ? shiftTypes.map((s) => s.shiftType)
              : [
                  'PAGI',
                  'MALAM',
                  'PIKET_PAGI',
                  'PIKET_MALAM',
                  'LIBUR',
                  'PAGI_MALAM',
                ];

          // Need raw query for month extraction - use findMany and aggregate in JS
          const schedules = await prisma.schedule.findMany({
            where: { tanggal: { gte: yearStart, lte: yearEnd } },
            select: { tanggal: true, keterangan: true },
          });

          // Aggregate by month and shift type - initialize all shift types to 0
          const monthlyData: Record<number, Record<string, number>> = {};
          for (let m = 0; m < 12; m++) {
            monthlyData[m] = {};
            // Initialize all shift types to 0 so chart always has data points
            defaultShiftTypes.forEach((shiftType) => {
              monthlyData[m][shiftType] = 0;
            });
          }

          schedules.forEach((s) => {
            const date = new Date(s.tanggal);
            const schedYear = date.getFullYear();
            const month = date.getMonth();
            const shift = s.keterangan;
            // Only include data from the requested year (extra safety for timezone edge cases)
            if (schedYear === year) {
              monthlyData[month][shift] = (monthlyData[month][shift] || 0) + 1;
            }
          });

          return MONTH_NAMES.map((name, idx) => ({
            name,
            ...monthlyData[idx],
          }));
        }),

      // 2. Cash aggregation by month
      prisma.cashEntry
        .findMany({
          where: { date: { gte: yearStart, lte: yearEnd } },
          select: { date: true, category: true, amount: true },
        })
        .then((entries) => {
          const monthlyData = MONTH_NAMES.map(() => ({ masuk: 0, keluar: 0 }));
          let runningSaldo = 0;

          // Sort entries by date for running balance
          entries.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          entries.forEach((e) => {
            const date = new Date(e.date);
            const entryYear = date.getFullYear();
            const month = date.getMonth();
            // Only include data from the requested year (safety for timezone edge cases)
            if (entryYear === year) {
              const amount = Number(e.amount);
              if (e.category === 'INCOME') {
                monthlyData[month].masuk += amount;
              } else {
                monthlyData[month].keluar += amount;
              }
            }
          });

          // Calculate running saldo
          return MONTH_NAMES.map((name, idx) => {
            runningSaldo += monthlyData[idx].masuk - monthlyData[idx].keluar;
            return {
              name,
              masuk: monthlyData[idx].masuk,
              keluar: monthlyData[idx].keluar,
              saldo: runningSaldo,
            };
          });
        }),

      // 3. Today's attendance (for highlights)
      prisma.attendance.findMany({
        where: { tanggal: { gte: todayStart, lte: todayEnd } },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              nickname: true,
              department: true,
            },
          },
        },
        orderBy: { jamAbsen: 'asc' },
      }),

      // 4. Today's schedules
      prisma.schedule.findMany({
        where: { tanggal: { gte: todayStart, lte: todayEnd } },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              nickname: true,
              department: true,
            },
          },
        },
      }),

      // 5. Year cash totals
      prisma.cashEntry
        .aggregate({
          where: { date: { gte: yearStart, lte: yearEnd } },
          _sum: { amount: true },
        })
        .then(async () => {
          const [income, expense] = await Promise.all([
            prisma.cashEntry.aggregate({
              where: {
                date: { gte: yearStart, lte: yearEnd },
                category: 'INCOME',
              },
              _sum: { amount: true },
            }),
            prisma.cashEntry.aggregate({
              where: {
                date: { gte: yearStart, lte: yearEnd },
                category: 'EXPENSE',
              },
              _sum: { amount: true },
            }),
          ]);
          return {
            totalIncome: Number(income._sum.amount || 0),
            totalExpense: Number(expense._sum.amount || 0),
          };
        }),

      // 6. User's yearly attendance (if userId provided)
      // Extended range: includes previous month for 16-15 filter support
      userId
        ? prisma.attendance.findMany({
            where: {
              memberId: userId,
              tanggal: { gte: extendedStart, lte: yearEnd },
            },
            select: { id: true, tanggal: true, status: true, memberId: true },
          })
        : Promise.resolve([]),

      // 7. Active shift settings (for colors)
      prisma.shiftSetting.findMany({
        where: { isActive: true },
        select: { shiftType: true, name: true, color: true },
      }),

      // 8. Job type leaderboard - aggregate task values by job type for current month
      prisma.dailyReport.findMany({
        where: {
          tanggal: {
            gte: new Date(year, currentMonth, 1),
            lte: new Date(year, currentMonth + 1, 0, 23, 59, 59, 999),
          },
        },
        select: {
          tasks: {
            select: {
              jobTypeId: true,
              value: true,
              jobType: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
    ]);

    // Get active shift types for initializing data
    const defaultShiftTypes =
      activeShifts.length > 0
        ? activeShifts.map((s) => s.shiftType)
        : ['PAGI', 'MALAM', 'PIKET_PAGI', 'PIKET_MALAM', 'LIBUR', 'PAGI_MALAM'];

    // Generate weekly data for current month (for 1bulan view)
    const monthStart = new Date(year, currentMonth, 1);
    const monthEnd = new Date(year, currentMonth + 1, 0, 23, 59, 59, 999);
    const daysInMonth = monthEnd.getDate();

    const weeklySchedules = await prisma.schedule.findMany({
      where: { tanggal: { gte: monthStart, lte: monthEnd } },
      select: { tanggal: true, keterangan: true },
    });

    const weekNames = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
    const scheduleByWeek = weekNames.map((name, weekIndex) => {
      const weekStart = weekIndex * 7 + 1;
      const weekEnd = Math.min(weekStart + 6, daysInMonth);

      const weekData: Record<string, number | string> = { name };
      defaultShiftTypes.forEach((shiftType) => {
        weekData[shiftType] = 0;
      });

      weeklySchedules.forEach((s) => {
        const day = new Date(s.tanggal).getDate();
        if (day >= weekStart && day <= weekEnd) {
          weekData[s.keterangan] =
            ((weekData[s.keterangan] as number) || 0) + 1;
        }
      });

      return weekData;
    });

    // Generate last 6 months data (cross-year for 6bulan view)
    const last6Months: { name: string; year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, currentMonth - i, 1);
      last6Months.push({
        name: MONTH_NAMES[d.getMonth()],
        year: d.getFullYear(),
        month: d.getMonth(),
      });
    }

    // Fetch schedules for last 6 months (may include previous year)
    const sixMonthStart = new Date(
      last6Months[0].year,
      last6Months[0].month,
      1
    );
    const sixMonthEnd = new Date(year, currentMonth + 1, 0, 23, 59, 59, 999);

    const sixMonthSchedules = await prisma.schedule.findMany({
      where: { tanggal: { gte: sixMonthStart, lte: sixMonthEnd } },
      select: { tanggal: true, keterangan: true },
    });

    const scheduleBy6Month = last6Months.map(({ name, year: y, month: m }) => {
      const monthData: Record<string, number | string> = { name };
      defaultShiftTypes.forEach((shiftType) => {
        monthData[shiftType] = 0;
      });

      sixMonthSchedules.forEach((s) => {
        const sDate = new Date(s.tanggal);
        if (sDate.getFullYear() === y && sDate.getMonth() === m) {
          monthData[s.keterangan] =
            ((monthData[s.keterangan] as number) || 0) + 1;
        }
      });

      return monthData;
    });

    // Generate weekly cash data for current month (for 1bulan view)
    const weeklyCashEntries = await prisma.cashEntry.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      select: { date: true, category: true, amount: true },
    });

    const cashByWeek = weekNames.map((name, weekIndex) => {
      const weekStart = weekIndex * 7 + 1;
      const weekEnd = Math.min(weekStart + 6, daysInMonth);

      let masuk = 0;
      let keluar = 0;

      weeklyCashEntries.forEach((e) => {
        const day = new Date(e.date).getDate();
        if (day >= weekStart && day <= weekEnd) {
          const amount = Number(e.amount);
          if (e.category === 'INCOME') {
            masuk += amount;
          } else {
            keluar += amount;
          }
        }
      });

      return { name, masuk, keluar, saldo: masuk - keluar };
    });

    // Generate last 6 months cash data (for 6bulan view)
    const sixMonthCashEntries = await prisma.cashEntry.findMany({
      where: { date: { gte: sixMonthStart, lte: sixMonthEnd } },
      select: { date: true, category: true, amount: true },
    });

    let runningCashSaldo = 0;
    const cashBy6Month = last6Months.map(({ name, year: y, month: m }) => {
      let masuk = 0;
      let keluar = 0;

      sixMonthCashEntries.forEach((e) => {
        const eDate = new Date(e.date);
        if (eDate.getFullYear() === y && eDate.getMonth() === m) {
          const amount = Number(e.amount);
          if (e.category === 'INCOME') {
            masuk += amount;
          } else {
            keluar += amount;
          }
        }
      });

      runningCashSaldo += masuk - keluar;
      return { name, masuk, keluar, saldo: runningCashSaldo };
    });

    // Calculate user stats
    const userStats = userId
      ? {
          totalAttendance: userYearlyAttendance.length,
          ontimeCount: userYearlyAttendance.filter((a) => a.status === 'ONTIME')
            .length,
          attendanceRecords: userYearlyAttendance,
        }
      : null;

    // Aggregate job type leaderboard from monthly report data
    // First, get all active job types
    const allJobTypes = await prisma.jobType.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    // Initialize aggregation with all job types (value 0)
    const jobTypeAggregated: Record<
      string,
      { id: string; name: string; totalValue: number }
    > = {};
    allJobTypes.forEach((jt) => {
      jobTypeAggregated[jt.id] = { id: jt.id, name: jt.name, totalValue: 0 };
    });

    // Add values from monthly reports
    monthlyReportData.forEach((report) => {
      report.tasks.forEach((task) => {
        if (task.jobType && jobTypeAggregated[task.jobType.id]) {
          jobTypeAggregated[task.jobType.id].totalValue += task.value;
        }
      });
    });

    // Sort by totalValue descending and create leaderboard with competition ranking
    // Same value = same rank, value 0 = rank null (displayed as "-")
    const sortedJobTypes = Object.values(jobTypeAggregated).sort(
      (a, b) => b.totalValue - a.totalValue
    );

    let currentRank = 1;
    let prevValue: number | null = null;
    const jobTypeLeaderboard = sortedJobTypes.map((item, index) => {
      // Value 0 gets rank null (displayed as "-")
      if (item.totalValue === 0) {
        return { rank: null, ...item };
      }
      // Competition ranking: same value = same rank
      if (prevValue !== null && item.totalValue === prevValue) {
        // Same rank as previous
        return { rank: currentRank, ...item };
      }
      // New rank based on position
      currentRank = index + 1;
      prevValue = item.totalValue;
      return { rank: currentRank, ...item };
    });

    return NextResponse.json({
      success: true,
      data: {
        scheduleByMonth: schedulesByMonth,
        scheduleByWeek: scheduleByWeek, // NEW: Weekly data for 1bulan
        scheduleby6Month: scheduleBy6Month, // NEW: Last 6 months for 6bulan
        cashByMonth: cashByMonth,
        cashByWeek: cashByWeek, // NEW: Weekly cash data for 1bulan
        cashBy6Month: cashBy6Month, // NEW: Last 6 months cash data for 6bulan
        todayStats: {
          attendance: todayAttendance,
          schedules: todaySchedules,
          ...yearCashTotals,
        },
        userStats,
        shiftSettings: activeShifts,
        jobTypeLeaderboard, // NEW: Job type leaderboard for current month
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard chart summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chart summary' },
      { status: 500 }
    );
  }
}
