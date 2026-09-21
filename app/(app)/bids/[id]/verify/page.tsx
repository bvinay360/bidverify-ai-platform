'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Upload, Eye, CheckCircle2, AlertTriangle,
  XCircle, Download, ShieldCheck, Loader2, Building2, Hash,
  Calendar, FileCheck, AlertCircle, Info, Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Bid, Document, ComplianceReport, Finding } from '@/lib/types';
import { DOC_TYPE_LABELS, DOC_TYPE_SHORT, BID_STATUS_LABELS, RISK_LEVEL_LABELS } from '@/lib/types';

export default function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const { toast } = useToast();
  const [bid, setBid] = useState<Bid | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: bidData } = await supabase
        .from('bids')
        .select(`*, tender:tenders(*), seller:profiles(*)`)
        .eq('id', id)
        .maybeSingle();

      if (bidData) {
        setBid(bidData as Bid);

        const { data: docData } = await supabase
          .from('documents')
          .select('*')
          .eq('bid_id', id)
          .order('created_at', { ascending: true });

        if (docData) setDocuments(docData as Document[]);

        const { data: reportData } = await supabase
          .from('compliance_reports')
          .select('*')
          .eq('bid_id', id)
          .maybeSingle();

        if (reportData) setReport(reportData as ComplianceReport);
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  const handleVerify = async () => {
    setVerifying(true);
    // Simulate AI verification with mock data
    await new Promise((r) => setTimeout(r, 2000));

    const score = bid?.compliance_score ?? Math.floor(60 + Math.random() * 35);
    const risk = score >= 80 ? 'LOW' : score >= 60 ? 'MEDIUM' : 'HIGH';
    const findings: Finding[] = [
      { type: 'GST_VERIFICATION', status: 'passed', message: 'GSTN 36ABCDE1234F1Z5 verified successfully with GST portal', severity: 'info' },
      { type: 'PAN_VERIFICATION', status: 'passed', message: 'PAN ABCDE1234F matches with income tax records', severity: 'info' },
      { type: 'NAME_MATCH', status: score >= 85 ? 'passed' : 'warning', message: score >= 85 ? 'Business name consistent across all documents' : 'Name mismatch: PAN shows "Tech Solutions Pvt Ltd" but GST shows "Tech Solution"', severity: score >= 85 ? 'info' : 'warning' },
      { type: 'UDYAM_CHECK', status: 'warning', message: 'Udyam certificate expires in 30 days', severity: 'warning' },
      { type: 'BIS_MISSING', status: score < 85 ? 'warning' : 'passed', message: score < 85 ? 'Missing BIS certificate for this product category' : 'BIS certificate verified', severity: score < 85 ? 'warning' : 'info' },
    ];

    // Upsert compliance report
    const { data: reportData } = await supabase
      .from('compliance_reports')
      .upsert({
        bid_id: id,
        overall_score: score,
        risk_level: risk,
        findings: findings,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (reportData) setReport(reportData as ComplianceReport);

    // Update bid
    const { data: updatedBid } = await supabase
      .from('bids')
      .update({ compliance_score: score, risk_level: risk, status: 'UNDER_REVIEW' })
      .eq('id', id)
      .select(`*, tender:tenders(*), seller:profiles(*)`)
      .maybeSingle();

    if (updatedBid) setBid(updatedBid as Bid);
    setVerifying(false);
    toast({ title: 'Verification Complete', description: `Compliance score: ${score}% — ${RISK_LEVEL_LABELS[risk as keyof typeof RISK_LEVEL_LABELS]}` });
  };

  const handleStatusUpdate = async (status: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW') => {
    setUpdating(true);
    const { data } = await supabase
      .from('bids')
      .update({ status })
      .eq('id', id)
      .select(`*, tender:tenders(*), seller:profiles(*)`)
      .maybeSingle();
    if (data) setBid(data as Bid);
    setUpdating(false);
    toast({ title: 'Status Updated', description: `Bid marked as ${BID_STATUS_LABELS[status]}.` });
  };

  const handleDownloadReport = () => {
    if (!bid || !report) return;
    const content = `
BIDVERIFY AI - COMPLIANCE REPORT
================================

Tender: ${bid.tender?.title}
Tender ID: ${bid.tender?.tender_id}
Seller: ${bid.seller?.name} (${bid.seller?.organization})
Bid ID: ${bid.id}
Submitted: ${new Date(bid.submitted_at).toLocaleDateString('en-IN')}

OVERALL COMPLIANCE SCORE: ${report.overall_score}%
RISK LEVEL: ${RISK_LEVEL_LABELS[report.risk_level]}

FINDINGS:
${report.findings.map((f, i) => `${i + 1}. [${f.status.toUpperCase()}] ${f.message}`).join('\n')}

DOCUMENTS VERIFIED:
${documents.map((d) => `- ${DOC_TYPE_LABELS[d.type]}: ${d.verification_status}`).join('\n')}

Generated: ${new Date(report.generated_at).toLocaleString('en-IN')}
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${bid.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Report Downloaded', description: 'Compliance report has been downloaded.' });
  };

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading bid details...</div>;
  if (!bid) return <div className="text-center text-muted-foreground py-12">Bid not found.</div>;

  const score = report?.overall_score ?? bid.compliance_score ?? 0;
  const risk = report?.risk_level ?? bid.risk_level;
  const scoreColor = score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-destructive';
  const scoreBg = score >= 80 ? 'bg-success' : score >= 60 ? 'bg-warning' : 'bg-destructive';
  const riskBadge = risk === 'LOW' ? 'bg-success text-success-foreground' : risk === 'MEDIUM' ? 'bg-warning text-warning-foreground' : 'bg-destructive text-destructive-foreground';
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link href={`/tenders/${bid.tender_id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Tender
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Compliance Verification</h1>
          <p className="text-muted-foreground">{bid.tender?.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{bid.tender?.tender_id}</Badge>
          <Badge variant={bid.status === 'APPROVED' ? 'default' : bid.status === 'REJECTED' ? 'destructive' : 'secondary'}>
            {BID_STATUS_LABELS[bid.status]}
          </Badge>
        </div>
      </div>

      {/* Seller Info Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {bid.seller?.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div>
              <p className="font-semibold text-foreground">{bid.seller?.name}</p>
              <p className="text-sm text-muted-foreground">{bid.seller?.organization} • {bid.seller?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN - Documents */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Documents</CardTitle>
                <Button size="sm" variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
              <CardDescription>{documents.length} documents uploaded</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {documents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No documents uploaded yet.</p>
              ) : (
                documents.map((doc) => {
                  const statusIcon = doc.verification_status === 'VERIFIED' ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : doc.verification_status === 'WARNING' ? (
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  ) : doc.verification_status === 'FAILED' ? (
                    <XCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  );
                  return (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors animate-fade-up">
                      <div className="flex items-center gap-3">
                        {statusIcon}
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {DOC_TYPE_SHORT[doc.type]}
                            </Badge>
                            <p className="text-sm font-medium text-foreground">{doc.file_name}</p>
                          </div>
                          {doc.ocr_data && (
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                              {Object.entries(doc.ocr_data).slice(0, 3).map(([key, val]) => (
                                <span key={key}>{key}: {String(val).slice(0, 20)}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN - AI Results */}
        <div className="space-y-4">
          {/* Compliance Score Circle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Compliance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {score > 0 ? (
                <div className="flex flex-col items-center py-4">
                  <div className="relative h-32 w-32">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-muted" />
                      <circle
                        cx="60" cy="60" r="52" fill="none" strokeWidth="10"
                        className={score >= 80 ? 'stroke-success' : score >= 60 ? 'stroke-warning' : 'stroke-destructive'}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-4xl font-bold ${scoreColor}`}>{score}%</span>
                      <span className="text-xs text-muted-foreground">Compliance</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Badge className={`text-sm ${riskBadge}`}>
                      <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                      {risk && RISK_LEVEL_LABELS[risk as keyof typeof RISK_LEVEL_LABELS]}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <FileCheck className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    No compliance analysis yet. Run the AI verification to get a score.
                  </p>
                </div>
              )}

              <Button
                className="w-full mt-2"
                onClick={handleVerify}
                disabled={verifying}
              >
                {verifying ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running AI Verification...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" />Run AI Verification</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Verification Checklist */}
          {report && (
            <Card className="animate-fade-up">
              <CardHeader><CardTitle>Verification Checklist</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {report.findings.map((finding, i) => {
                  const icon = finding.status === 'passed' ? (
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  ) : finding.status === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                  ) : finding.status === 'failed' ? (
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  ) : (
                    <Info className="h-5 w-5 text-primary flex-shrink-0" />
                  );
                  return (
                    <div key={i} className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/30 transition-colors">
                      {icon}
                      <div>
                        <p className="text-sm font-medium text-foreground">{finding.message}</p>
                        <p className="text-xs text-muted-foreground capitalize">{finding.type.replace(/_/g, ' ').toLowerCase()}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Extracted Data Cards */}
          {documents.some((d) => d.ocr_data) && (
            <Card className="animate-fade-up">
              <CardHeader><CardTitle>Extracted Data</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {documents.filter((d) => d.ocr_data).map((doc) => (
                  <div key={doc.id} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">{DOC_TYPE_SHORT[doc.type]}</Badge>
                      <span className="text-xs text-muted-foreground">{DOC_TYPE_LABELS[doc.type]}</span>
                    </div>
                    <div className="space-y-1">
                      {doc.ocr_data && Object.entries(doc.ocr_data).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="font-medium text-foreground">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Flags/Warnings */}
          {report && report.findings.some((f) => f.severity === 'warning' || f.severity === 'error') && (
            <Card className="border-warning/30 animate-fade-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertCircle className="h-5 w-5" />
                  Flags &amp; Warnings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.findings.filter((f) => f.severity === 'warning' || f.severity === 'error').map((f, i) => (
                  <div key={i} className={`flex items-start gap-2 rounded-lg p-3 ${f.severity === 'error' ? 'bg-destructive/5' : 'bg-warning/5'}`}>
                    <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${f.severity === 'error' ? 'text-destructive' : 'text-warning'}`} />
                    <p className="text-sm text-foreground">{f.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button
                className="w-full"
                variant="outline"
                onClick={handleDownloadReport}
                disabled={!report || updating}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Compliance Report
              </Button>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  className="bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => handleStatusUpdate('APPROVED')}
                  disabled={updating || bid.status === 'APPROVED'}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleStatusUpdate('UNDER_REVIEW')}
                  disabled={updating || bid.status === 'UNDER_REVIEW'}
                >
                  Clarification
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate('REJECTED')}
                  disabled={updating || bid.status === 'REJECTED'}
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
