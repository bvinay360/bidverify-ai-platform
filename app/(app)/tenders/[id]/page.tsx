'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, IndianRupee, Building2, FileText, Eye, IndianRupee as Rupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';
import type { Tender, Bid } from '@/lib/types';
import { TENDER_STATUS_LABELS, BID_STATUS_LABELS, RISK_LEVEL_LABELS, DOC_TYPE_LABELS } from '@/lib/types';

export default function TenderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const [tender, setTender] = useState<Tender | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: tenderData } = await supabase
        .from('tenders')
        .select(`*, buyer:profiles(*)`)
        .eq('id', id)
        .maybeSingle();

      if (tenderData) {
        setTender(tenderData as Tender);

        const { data: bidData } = await supabase
          .from('bids')
          .select(`*, seller:profiles(*)`)
          .eq('tender_id', id)
          .order('submitted_at', { ascending: false });

        if (bidData) setBids(bidData as Bid[]);
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading tender...</div>;
  if (!tender) return <div className="text-center text-muted-foreground py-12">Tender not found.</div>;

  const isBuyer = profile?.id === tender.buyer_id;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/tenders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Tenders
        </Link>
      </div>

      {/* Tender Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={tender.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {TENDER_STATUS_LABELS[tender.status as keyof typeof TENDER_STATUS_LABELS] || tender.status}
                </Badge>
                <span className="font-mono text-sm text-muted-foreground">{tender.tender_id}</span>
              </div>
              <CardTitle className="text-2xl">{tender.title}</CardTitle>
              <CardDescription className="mt-2">{tender.category}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">{tender.description}</p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Rupee className="h-4 w-4" />Budget
              </div>
              <p className="text-xl font-bold text-foreground">₹{tender.budget.toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />Deadline
              </div>
              <p className="text-xl font-bold text-foreground">
                {new Date(tender.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Building2 className="h-4 w-4" />Posted By
              </div>
              <p className="text-lg font-bold text-foreground">{tender.buyer?.organization || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">{tender.buyer?.name}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold text-foreground mb-3">Required Documents</h4>
            <div className="flex flex-wrap gap-2">
              {tender.required_documents.map((doc) => (
                <Badge key={doc} variant="outline">
                  <FileText className="mr-1.5 h-3 w-3" />
                  {DOC_TYPE_LABELS[doc as keyof typeof DOC_TYPE_LABELS] || doc}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bids List */}
      <Card>
        <CardHeader>
          <CardTitle>Received Bids ({bids.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {bids.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No bids received yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead className="text-center">Compliance Score</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map((bid) => (
                  <TableRow key={bid.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{bid.seller?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{bid.seller?.organization}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {bid.compliance_score !== null ? (
                        <span className={`text-lg font-bold ${bid.compliance_score >= 80 ? 'text-success' : bid.compliance_score >= 60 ? 'text-warning' : 'text-destructive'}`}>
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
                          Review
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
