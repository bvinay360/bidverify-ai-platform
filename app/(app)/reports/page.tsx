'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { Download, FileSpreadsheet, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import type { Bid, ComplianceReport } from '@/lib/types';
import { RISK_LEVEL_LABELS } from '@/lib/types';

export default function ReportsPage() {
  const { toast } = useToast();
  const [bids, setBids] = useState<Bid[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: bidData } = await supabase
        .from('bids')
        .select(`*, tender:tenders(*), seller:profiles(*)`)
        .order('submitted_at', { ascending: true });

      if (bidData) setBids(bidData as Bid[]);

      const { data: reportData } = await supabase
        .from('compliance_reports')
        .select(`*, bid:bids(*, tender:tenders(*), seller:profiles(*))`)
        .order('generated_at', { ascending: false });

      if (reportData) setReports(reportData as unknown as ComplianceReport[]);
      setLoading(false);
    }
    loadData();
  }, []);

  // Compliance trend data (avg score over time by month)
  const trendData = useMemo(() => {
    const months: Record<string, { month: string; avgScore: number; count: number }> = {};
    bids.forEach((bid) => {
      if (bid.compliance_score === null) return;
      const date = new Date(bid.submitted_at);
      const key = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!months[key]) months[key] = { month: key, avgScore: 0, count: 0 };
      months[key].avgScore += bid.compliance_score;
      months[key].count += 1;
    });
    return Object.values(months).map((m) => ({
      month: m.month,
      avgScore: Math.round(m.avgScore / m.count),
    }));
  }, [bids]);

  // Risk distribution
  const riskData = useMemo(() => {
    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    bids.forEach((b) => {
      if (b.risk_level) counts[b.risk_level as keyof typeof counts]++;
    });
    return [
      { name: 'Low Risk', value: counts.LOW, color: 'hsl(var(--success))' },
      { name: 'Medium Risk', value: counts.MEDIUM, color: 'hsl(var(--warning))' },
      { name: 'High Risk', value: counts.HIGH, color: 'hsl(var(--destructive))' },
    ].filter((d) => d.value > 0);
  }, [bids]);

  // Top compliance issues
  const issueData = useMemo(() => {
    const issues: Record<string, number> = {};
    reports.forEach((r) => {
      r.findings?.forEach((f) => {
        if (f.severity === 'warning' || f.severity === 'error') {
          const label = f.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
          issues[label] = (issues[label] || 0) + 1;
        }
      });
    });
    return Object.entries(issues)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [reports]);

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading reports...</div>;

  const avgScore = bids.filter((b) => b.compliance_score !== null).length > 0
    ? Math.round(bids.filter((b) => b.compliance_score !== null).reduce((sum, b) => sum + (b.compliance_score ?? 0), 0) / bids.filter((b) => b.compliance_score !== null).length)
    : 0;
  const highRiskCount = bids.filter((b) => b.risk_level === 'HIGH').length;
  const approvedCount = bids.filter((b) => b.status === 'APPROVED').length;

  const handleExportExcel = () => {
    const headers = ['Bid ID', 'Tender', 'Seller', 'Score', 'Risk', 'Status', 'Submitted'];
    const rows = bids.map((b) => [
      b.id.slice(0, 8),
      b.tender?.title ?? '',
      b.seller?.name ?? '',
      b.compliance_score ?? 'N/A',
      b.risk_level ?? 'N/A',
      b.status,
      new Date(b.submitted_at).toLocaleDateString('en-IN'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bidverify-report.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export Complete', description: 'Report exported as CSV.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports &amp; Analytics</h1>
          <p className="text-muted-foreground">Compliance trends and risk analysis across all bids.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => toast({ title: 'Downloading', description: 'Generating PDF report...' })}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="animate-fade-up">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Compliance</p>
                <p className="text-2xl font-bold text-foreground">{avgScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved Bids</p>
                <p className="text-2xl font-bold text-foreground">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High-Risk Bids</p>
                <p className="text-2xl font-bold text-foreground">{highRiskCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compliance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Trend</CardTitle>
            <CardDescription>Average compliance score over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[0, 100]} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="avgScore" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Bids by risk level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {riskData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Top Compliance Issues</CardTitle>
          <CardDescription>Most frequently flagged issues across all bids</CardDescription>
        </CardHeader>
        <CardContent>
          {issueData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No compliance issues found.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={issueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis dataKey="name" type="category" width={150} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Reports Table */}
      <Card>
        <CardHeader><CardTitle>Recent Compliance Reports</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bid</TableHead>
                <TableHead>Tender</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No reports generated yet.</TableCell>
                </TableRow>
              ) : (
                reports.slice(0, 10).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.bid_id?.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{r.bid?.tender?.title ?? 'Unknown'}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${r.overall_score >= 80 ? 'text-success' : r.overall_score >= 60 ? 'text-warning' : 'text-destructive'}`}>
                        {r.overall_score}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={r.risk_level === 'LOW' ? 'bg-success text-success-foreground' : r.risk_level === 'MEDIUM' ? 'bg-warning text-warning-foreground' : 'bg-destructive text-destructive-foreground'}>
                        {RISK_LEVEL_LABELS[r.risk_level as keyof typeof RISK_LEVEL_LABELS]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.generated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
