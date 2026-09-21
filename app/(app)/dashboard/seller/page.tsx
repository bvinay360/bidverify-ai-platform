'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase, Gauge, FileCheck, Trophy,
  Search, Eye,
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
import type { Bid } from '@/lib/types';
import { BID_STATUS_LABELS, RISK_LEVEL_LABELS } from '@/lib/types';

export default function SellerDashboard() {
  const { profile } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [stats, setStats] = useState({ activeBids: 0, avgCompliance: 0, docsVerified: 0, wonTenders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!profile) return;
      const { data: bidData } = await supabase
        .from('bids')
        .select(`*, tender:tenders(*), documents(*)`)
        .eq('seller_id', profile.id)
        .order('submitted_at', { ascending: false });

      if (bidData) {
        setBids(bidData as Bid[]);
        const activeBids = bidData.filter((b) => b.status === 'SUBMITTED' || b.status === 'UNDER_REVIEW').length;
        const validBids = bidData.filter((b) => b.compliance_score !== null);
        const avgCompliance = validBids.length > 0
          ? Math.round(validBids.reduce((sum, b) => sum + (b.compliance_score ?? 0), 0) / validBids.length)
          : 0;
        const docsVerified = bidData.reduce((sum, b) => {
          const docs = (b as any).documents ?? [];
          return sum + docs.filter((d: any) => d.verification_status === 'VERIFIED').length;
        }, 0);
        const wonTenders = bidData.filter((b) => b.status === 'APPROVED').length;
        setStats({ activeBids, avgCompliance, docsVerified, wonTenders });
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
          <h1 className="text-2xl font-bold text-foreground">Seller Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.name}. Here&apos;s your bidding overview.</p>
        </div>
        <Link href="/tenders">
          <Button className="w-full sm:w-auto">
            <Search className="mr-2 h-4 w-4" />
            Browse Tenders
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Active Bids" value={stats.activeBids} icon={Briefcase} trend="Submitted or under review" />
        <MetricCard title="Compliance Score" value={`${stats.avgCompliance}%`} icon={Gauge} variant={stats.avgCompliance >= 80 ? 'success' : stats.avgCompliance >= 60 ? 'warning' : 'destructive'} trend="Average across your bids" />
        <MetricCard title="Documents Verified" value={stats.docsVerified} icon={FileCheck} variant="success" trend="Successfully verified" />
        <MetricCard title="Won Tenders" value={stats.wonTenders} icon={Trophy} variant="success" trend="Approved bids" />
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Bids</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tender</TableHead>
                <TableHead className="text-center">Compliance</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bids.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No bids submitted yet. Click &quot;Browse Tenders&quot; to find opportunities.
                  </TableCell>
                </TableRow>
              ) : (
                bids.map((bid) => (
                  <TableRow key={bid.id}>
                    <TableCell className="font-medium max-w-xs truncate">{bid.tender?.title ?? 'Unknown tender'}</TableCell>
                    <TableCell className="text-center">
                      {bid.compliance_score !== null ? (
                        <span className={`font-bold ${bid.compliance_score >= 80 ? 'text-success' : bid.compliance_score >= 60 ? 'text-warning' : 'text-destructive'}`}>
                          {bid.compliance_score}%
                        </span>
                      ) : (<span className="text-muted-foreground">--</span>)}
                    </TableCell>
                    <TableCell>
                      {bid.risk_level && (
                        <Badge variant={bid.risk_level === 'LOW' ? 'default' : bid.risk_level === 'MEDIUM' ? 'secondary' : 'destructive'}
                          className={bid.risk_level === 'LOW' ? 'bg-success text-success-foreground' : bid.risk_level === 'MEDIUM' ? 'bg-warning text-warning-foreground' : ''}>
                          {RISK_LEVEL_LABELS[bid.risk_level]}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={bid.status === 'APPROVED' ? 'default' : bid.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                        {BID_STATUS_LABELS[bid.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(bid.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/bids/${bid.id}/verify`}>
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
