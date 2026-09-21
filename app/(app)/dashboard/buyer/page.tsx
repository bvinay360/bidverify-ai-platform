'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase, ClipboardList, Gauge, AlertTriangle,
  Plus, Eye, Calendar,
} from 'lucide-react';
import { MetricCard } from '@/components/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';
import type { Tender } from '@/lib/types';
import { TENDER_STATUS_LABELS } from '@/lib/types';

export default function BuyerDashboard() {
  const { profile } = useAuth();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [stats, setStats] = useState({ totalTenders: 0, totalBids: 0, avgCompliance: 0, highRiskBids: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!profile) return;
      const { data: tenderData } = await supabase
        .from('tenders')
        .select(`*, bids(count)`)
        .eq('buyer_id', profile.id)
        .order('created_at', { ascending: false });

      if (tenderData) {
        const formatted = tenderData.map((t: any) => ({ ...t, bid_count: t.bids?.[0]?.count ?? 0 })) as Tender[];
        setTenders(formatted);
        const totalTenders = formatted.length;
        const totalBids = formatted.reduce((sum, t) => sum + (t.bid_count ?? 0), 0);

        const { data: bidsData } = await supabase
          .from('bids')
          .select('compliance_score, risk_level')
          .in('tender_id', formatted.map((t) => t.id));

        const validBids = (bidsData || []).filter((b) => b.compliance_score !== null);
        const avgCompliance = validBids.length > 0
          ? Math.round(validBids.reduce((sum, b) => sum + (b.compliance_score ?? 0), 0) / validBids.length)
          : 0;
        const highRiskBids = (bidsData || []).filter((b) => b.risk_level === 'HIGH').length;
        setStats({ totalTenders, totalBids, avgCompliance, highRiskBids });
      }
      setLoading(false);
    }
    loadData();
  }, [profile]);

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Buyer Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.name}. Here&apos;s your procurement overview.</p>
        </div>
        <Link href="/tenders/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Post New Tender
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Tenders Posted" value={stats.totalTenders} icon={Briefcase} trend={`${tenders.filter((t) => t.status === 'ACTIVE').length} active`} />
        <MetricCard title="Bids Received" value={stats.totalBids} icon={ClipboardList} trend="Across all tenders" />
        <MetricCard title="Avg Compliance Score" value={`${stats.avgCompliance}%`} icon={Gauge} variant={stats.avgCompliance >= 80 ? 'success' : stats.avgCompliance >= 60 ? 'warning' : 'destructive'} trend="Across all reviewed bids" />
        <MetricCard title="High-Risk Bids" value={stats.highRiskBids} icon={AlertTriangle} variant="destructive" trend="Require immediate attention" />
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Tenders</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tender ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="text-center">Bids</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No tenders posted yet. Click &quot;Post New Tender&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                tenders.map((tender) => (
                  <TableRow key={tender.id} className="cursor-pointer">
                    <TableCell className="font-mono text-xs">{tender.tender_id}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{tender.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {new Date(tender.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">{tender.bid_count ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={tender.status === 'ACTIVE' ? 'default' : tender.status === 'CLOSED' ? 'secondary' : 'outline'}>
                        {TENDER_STATUS_LABELS[tender.status as keyof typeof TENDER_STATUS_LABELS] || tender.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/tenders/${tender.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View
                        </Button>
                      </Link>
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
