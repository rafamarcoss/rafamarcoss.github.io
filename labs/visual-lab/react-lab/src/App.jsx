import React, { useState } from 'react';
import BentoGrid from '@/components/kokonutui/bento-grid';
import SmoothTab from '@/components/kokonutui/smooth-tab';
import MouseEffectCard from '@/components/kokonutui/mouse-effect-card';
import CardStackExample from '@/showcase/kokonut-cardstack';
import { LineChart, Line } from '@/components/charts/line-chart';
import { AreaChart } from '@/components/charts/area-chart';
import { Area } from '@/components/charts/area';
import { BarChart } from '@/components/charts/bar-chart';
import { Bar } from '@/components/charts/bar';
import { RadarChart } from '@/components/charts/radar-chart';
import { RadarArea } from '@/components/charts/radar-area';
import { RadarAxis } from '@/components/charts/radar-axis';
import { RadarGrid } from '@/components/charts/radar-grid';
import { RadarLabels } from '@/components/charts/radar-labels';
import { BarXAxis } from '@/components/charts/bar-x-axis';
import { Grid, XAxis, ChartTooltip } from '@/components/charts';

/* ---------------- demo data (telemetry) ---------------- */

const DAYS = ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14'];
const pipelineData = DAYS.map((date, i) => ({
  date,
  successful: 8 + ((i * 3) % 9),
  failed: (i % 5 === 0) ? 2 : ((i * 2) % 3),
}));

const sourcesData = DAYS.map((date, i) => ({
  date,
  articles: 30 + ((i * 4) % 25),
  sources: 300 + i * 18,
}));

const activityData = [
  { category: 'AI Research', runs: 34 },
  { category: 'CRM', runs: 51 },
  { category: 'Publishing', runs: 23 },
  { category: 'Integrations', runs: 47 },
  { category: 'Monitoring', runs: 19 },
];

const radarMetrics = [
  { key: 'coverage', label: 'Coverage' },
  { key: 'success', label: 'Success' },
  { key: 'speed', label: 'Speed' },
  { key: 'automation', label: 'Automation' },
  { key: 'stability', label: 'Stability' },
];
const radarData = [{ id: 'demo', values: { coverage: 82, success: 91, speed: 74, automation: 66, stability: 88 } }];

/* ---------------- rating ---------------- */

const RATINGS = ['Use', 'Maybe', 'Skip'];

function Rating({ value, onChange }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Decision">
      {RATINGS.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          className={`rounded-full border px-3 py-1 text-[11px] font-mono font-bold transition-colors ${
            value === option
              ? option === 'Use'
                ? 'border-teal bg-teal/15 text-ink'
                : option === 'Maybe'
                  ? 'border-blue bg-blue/15 text-ink'
                  : 'border-coral/50 bg-coral/10 text-ink'
              : 'border-border text-muted hover:border-ink/30'
          }`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-4 text-sm text-muted">
          <span className="font-mono font-bold text-coral">Render error:</span> {String(this.state.error.message || this.state.error)}
        </div>
      );
    }
    return this.props.children;
  }
}

function ExperimentCard({ title, use, component, onRate, rating }) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-[0_16px_50px_rgba(11,14,15,0.06)]">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-bold tracking-tight">{title}</h3>
          <p className="text-sm text-muted">{use}</p>
        </div>
        <Rating value={rating} onChange={onRate} />
      </header>
      <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-border/60">
        <ErrorBoundary>{component}</ErrorBoundary>
      </div>
    </section>
  );
}

function Summary({ label, items }) {
  const counts = { Use: 0, Maybe: 0, Skip: 0 };
  items.forEach((v) => { if (counts[v] !== undefined) counts[v] += 1; });
  return (
    <p className="font-mono text-xs font-bold text-muted">
      {label}: {counts.Use} Use · {counts.Maybe} Maybe · {counts.Skip} Skip
    </p>
  );
}

/* ---------------- kokonut ---------------- */

const smoothItems = [
  { id: 'automate', label: 'Automate', content: 'Describe the rule once and let the platform run it on a schedule, on a webhook or on a manual trigger.' },
  { id: 'integrate', label: 'Integrate', content: 'Connect CRMs, ERPs and APIs through native connectors or a generic REST adapter with clean error handling.' },
  { id: 'analyze', label: 'Analyze', content: 'See runs, failures and bottlenecks in one place, with exportable logs for your own tooling.' },
];

function KokonutSection() {
  const [bento, setBento] = useState(null);
  const [stack, setStack] = useState(null);
  const [tabs, setTabs] = useState(null);
  const [mouse, setMouse] = useState(null);

  return (
    <section className="grid gap-4 md:grid-cols-2" id="kokonut">
      <div className="md:col-span-2">
        <Summary label="Kokonut" items={[bento, stack, tabs, mouse]} />
      </div>
      <ExperimentCard
        title="Bento Grid"
        use="SaaS feature area · Kokonut BentoGrid"
        rating={bento}
        onRate={setBento}
        component={
          <div className="bg-white dark:bg-black">
            <div className="border-b border-border/40 px-5 py-3">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-teal">FlowPilot · Demo SaaS concept</p>
            </div>
            <BentoGrid />
          </div>
        }
      />
      <ExperimentCard
        title="Card Stack"
        use="Product capabilities stack · adapted CardStack"
        rating={stack}
        onRate={setStack}
        component={<CardStackExample className="mt-4 mb-0" />}
      />
      <ExperimentCard
        title="Smooth Tabs"
        use="Animated product tabs · Kokonut SmoothTab"
        rating={tabs}
        onRate={setTabs}
        component={
          <div className="p-4">
            <SmoothTab
              items={smoothItems}
              activeColor="bg-teal"
              className="w-full"
            />
          </div>
        }
      />
      <ExperimentCard
        title="Mouse Effect Card"
        use="Subtle pointer interaction · Kokonut MouseEffectCard"
        rating={mouse}
        onRate={setMouse}
        component={
          <div className="p-6">
            <MouseEffectCard
              title="FlowPilot"
              subtitle="AI workflow orchestration for automation teams."
              topText="Demo SaaS"
              className="w-full"
            />
          </div>
        }
      />
    </section>
  );
}

/* ---------------- bklit ---------------- */

function BklitSection() {
  const [line, setLine] = useState(null);
  const [area, setArea] = useState(null);
  const [bar, setBar] = useState(null);
  const [radar, setRadar] = useState(null);

  return (
    <section id="bklit">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">AI Signal / RafaOps · Telemetry concept</h2>
          <p className="text-sm text-muted">Bklit UI charts · demo data only</p>
        </div>
        <span className="rounded-full border border-coral/40 bg-coral/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">Demo data</span>
      </div>
      <div className="mb-4"><Summary label="Bklit" items={[line, area, bar, radar]} /></div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          ['Pipeline Status', 'Healthy'],
          ['Runs', '142 demo'],
          ['Sources', '1,280 demo'],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-muted">{k}</p>
            <p className="mt-1 font-display text-xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ExperimentCard
          title="Line Chart"
          use="Pipeline runs over 14 days"
          rating={line}
          onRate={setLine}
          component={
            <div className="p-4">
              <LineChart data={pipelineData} xDataKey="date">
                <Line dataKey="successful" stroke="var(--chart-1)" />
                <Line dataKey="failed" stroke="var(--chart-3)" />
                <Grid />
                <XAxis dataKey="date" />
                <ChartTooltip />
              </LineChart>
            </div>
          }
        />
        <ExperimentCard
          title="Area Chart"
          use="Articles / sources processed over time"
          rating={area}
          onRate={setArea}
          component={
            <div className="p-4">
              <AreaChart data={sourcesData} xDataKey="date">
                <Area dataKey="articles" stroke="var(--chart-2)" />
                <Area dataKey="sources" stroke="var(--chart-4)" />
                <Grid />
                <XAxis dataKey="date" />
                <ChartTooltip />
              </AreaChart>
            </div>
          }
        />
        <ExperimentCard
          title="Bar Chart"
          use="Workflow activity by category"
          rating={bar}
          onRate={setBar}
          component={
            <div className="p-4">
              <BarChart data={activityData} xDataKey="category">
                <Grid horizontal />
                <Bar dataKey="runs" fill="var(--chart-line-primary)" lineCap="round" />
                <BarXAxis />
                <ChartTooltip />
              </BarChart>
            </div>
          }
        />
        <ExperimentCard
          title="Radar Chart"
          use="Capability profile · demo telemetry"
          rating={radar}
          onRate={setRadar}
          component={
            <div className="flex items-center justify-center p-4">
              <RadarChart data={radarData} metrics={radarMetrics} size={300}>
                <RadarGrid />
                <RadarAxis />
                <RadarLabels fontSize={10} offset={16} />
                {radarData.map((row, i) => (
                  <RadarArea key={row.id} index={i} fill="var(--chart-line-primary)" fillOpacity={0.35} />
                ))}
              </RadarChart>
            </div>
          }
        />
      </div>
    </section>
  );
}

/* ---------------- app ---------------- */

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden text-foreground">
      <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
        <a href="/labs/visual-lab/" className="rounded-full border border-border px-4 py-1.5 font-mono text-xs font-bold">← Visual Lab</a>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">React Showcase</h1>
        <p className="mt-2 max-w-2xl text-muted">Isolated React playground for Kokonut UI and Bklit UI. Ratings are local only.</p>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 border-b border-border pb-3">
          <h2 className="font-display text-2xl font-bold tracking-tight">02 — Kokonut UI</h2>
        </div>
        <KokonutSection />
        <div className="my-10 h-px bg-border" />
        <BklitSection />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8">
        <p className="mt-1 font-mono text-[11px] text-muted">All charts and metrics are demo data. Not production telemetry. Ratings are local only and reset on refresh.</p>
      </footer>
    </div>
  );
}