import type { Metadata } from "next";
import { CHART_COLORS, DonutChart, SimpleBarChart, SimpleLineChart } from "@/components/charts/Charts";
import { Card, PageHeader } from "@/components/ui/Card";
import { countByCondition, getDashboardStats, riskHistogram } from "@/database/repositories/assets";
import { inspectionsPerMonth } from "@/database/repositories/inspections";
import { maintenanceTrend, openDueByMonth } from "@/database/repositories/maintenance";
import { lastMonthKeys, monthLabel } from "@/utils/dates";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  const stats = getDashboardStats();
  const cond = countByCondition();
  const countOf = (c: string | null) => cond.find((x) => x.condition === c)?.count ?? 0;

  const conditionData = [
    { name: "Good", value: countOf("Good"), color: CHART_COLORS.green },
    { name: "Moderate", value: countOf("Moderate"), color: CHART_COLORS.yellow },
    { name: "High Risk", value: countOf("High Risk"), color: CHART_COLORS.red },
    { name: "Not inspected", value: countOf(null), color: CHART_COLORS.slate },
  ].filter((d) => d.value > 0);

  const order = ["Low (0-30)", "Moderate (31-60)", "High (61-100)"];
  const hist = riskHistogram();
  const riskData = order.map((b) => ({ label: b, count: hist.find((h) => h.bucket === b)?.count ?? 0 }));

  const coverageData = [
    { name: "Inspected", value: stats.inspected, color: CHART_COLORS.blue },
    { name: "Pending", value: stats.totalAssets - stats.inspected, color: CHART_COLORS.slate },
  ];

  // Last 12 months of history.
  const months = lastMonthKeys(12);
  const insp = inspectionsPerMonth();
  const maint = maintenanceTrend();
  const inspectionTrend = months.map((m) => ({ label: monthLabel(m), inspections: insp.find((i) => i.month === m)?.count ?? 0 }));
  const riskTrend = months.map((m) => ({ label: monthLabel(m), avg: insp.find((i) => i.month === m)?.avgRisk ?? 0 })).filter((d) => d.avg > 0);
  const maintTrend = months.map((m) => ({
    label: monthLabel(m),
    created: maint.find((x) => x.month === m)?.created ?? 0,
    completed: maint.find((x) => x.month === m)?.completed ?? 0,
  }));

  // Open maintenance by due month (next 6 months, plus anything overdue folded into the current month).
  const dueKeys = lastMonthKeys(1, 5);
  const current = dueKeys[0];
  const dueRaw = openDueByMonth();
  const dueData = dueKeys.map((m) => ({
    label: monthLabel(m),
    due: dueRaw.filter((d) => (m === current ? d.month <= current : d.month === m)).reduce((s, d) => s + d.count, 0),
  }));

  return (
    <>
      <PageHeader title="Analytics" description="Condition, risk, inspection and maintenance trends across the demo network." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Asset condition distribution" subtitle="Latest recorded condition per asset">
          <DonutChart data={conditionData} />
        </Card>
        <Card title="Risk distribution" subtitle="Number of assets per risk band">
          <SimpleBarChart data={riskData} series={[{ key: "count", name: "Assets", color: CHART_COLORS.navy }]} />
        </Card>
        <Card title="Inspected vs pending" subtitle="Inspection coverage across all registered assets">
          <DonutChart data={coverageData} />
        </Card>
        <Card title="Inspection trend" subtitle="Inspections recorded per month, last 12 months">
          <SimpleLineChart data={inspectionTrend} series={[{ key: "inspections", name: "Inspections", color: CHART_COLORS.blue }]} />
        </Card>
        <Card title="Maintenance due by month" subtitle="Open actions by due date (overdue counted in current month)">
          <SimpleBarChart data={dueData} series={[{ key: "due", name: "Open actions", color: CHART_COLORS.yellow }]} />
        </Card>
        <Card title="Maintenance trend" subtitle="Actions raised vs completed per month">
          <SimpleBarChart
            data={maintTrend}
            series={[
              { key: "created", name: "Raised", color: CHART_COLORS.navy },
              { key: "completed", name: "Completed", color: CHART_COLORS.green },
            ]}
          />
        </Card>
        <Card title="Risk trend" subtitle="Average risk score of inspections per month" className="lg:col-span-2">
          <SimpleLineChart data={riskTrend} series={[{ key: "avg", name: "Avg risk score", color: CHART_COLORS.red }]} yDomain={[0, 100]} />
        </Card>
      </div>
    </>
  );
}
