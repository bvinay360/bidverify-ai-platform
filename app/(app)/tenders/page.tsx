'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Calendar, IndianRupee, Building2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase-client';
import type { Tender } from '@/lib/types';
import { TENDER_STATUS_LABELS, CATEGORIES } from '@/lib/types';

export default function BrowseTendersPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    async function loadTenders() {
      const { data } = await supabase
        .from('tenders')
        .select(`*, buyer:profiles(*), bids(count)`)
        .order('created_at', { ascending: false });
      if (data) {
        const formatted = data.map((t: any) => ({ ...t, bid_count: t.bids?.[0]?.count ?? 0 })) as Tender[];
        setTenders(formatted);
      }
      setLoading(false);
    }
    loadTenders();
  }, []);

  const filteredTenders = useMemo(() => {
    return tenders.filter((t) => {
      const matchesSearch = !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.tender_id.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tenders, search, categoryFilter, statusFilter]);

  if (loading) return <div className="animate-pulse text-muted-foreground">Loading tenders...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Browse Tenders</h1>
        <p className="text-muted-foreground">Find active procurement opportunities to bid on.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by title, ID, or description..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
              <option value="EVALUATION">Evaluation</option>
              <option value="AWARDED">Awarded</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">Showing {filteredTenders.length} of {tenders.length} tenders</p>

      {filteredTenders.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No tenders match your filters. Try adjusting your search.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTenders.map((tender) => (
            <Card key={tender.id} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30 flex flex-col animate-fade-up">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={tender.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {TENDER_STATUS_LABELS[tender.status as keyof typeof TENDER_STATUS_LABELS] || tender.status}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">{tender.tender_id}</span>
                </div>
                <CardTitle className="text-lg leading-tight mt-2 group-hover:text-primary transition-colors">{tender.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{tender.description}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm"><Badge variant="outline">{tender.category}</Badge></div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground"><IndianRupee className="h-3.5 w-3.5" />{tender.budget.toLocaleString('en-IN')}</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{new Date(tender.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  {tender.buyer && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="h-3 w-3" />{tender.buyer.organization || 'Unknown'}</div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">{tender.bid_count ?? 0} bids received</span>
                    <Link href={`/tenders/${tender.id}`}>
                      <Button size="sm" variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        View Details<ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
