'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-client';
import { CATEGORIES, ALL_DOC_TYPES, DOC_TYPE_LABELS } from '@/lib/types';

export default function PostTenderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    tenderId: `GEM/2024/${Math.floor(1000 + Math.random() * 9000)}`,
    title: '', description: '', category: CATEGORIES[0],
    budget: '', deadline: '',
    requiredDocuments: ['GST_CERTIFICATE', 'PAN_CARD'] as string[],
  });
  const [loading, setLoading] = useState(false);

  const toggleDocument = (docType: string) => {
    setFormData((prev) => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.includes(docType)
        ? prev.requiredDocuments.filter((d) => d !== docType)
        : [...prev.requiredDocuments, docType],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.budget || !formData.deadline) {
      toast({ title: 'Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    if (formData.requiredDocuments.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one required document.', variant: 'destructive' });
      return;
    }
    if (!profile) {
      toast({ title: 'Error', description: 'You must be signed in to post a tender.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('tenders')
      .insert({
        tender_id: formData.tenderId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budget: parseFloat(formData.budget),
        deadline: new Date(formData.deadline).toISOString(),
        required_documents: formData.requiredDocuments,
        status: 'ACTIVE',
        buyer_id: profile.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Failed to Create Tender', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }
    toast({ title: 'Tender Posted', description: 'Your tender has been posted successfully.' });
    router.push(`/tenders/${data.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/buyer" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Post New Tender</h1>
        <p className="text-muted-foreground">Create a new procurement tender for sellers to bid on.</p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Tender Details</CardTitle>
          <CardDescription>Fill in the information below to post your tender.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tenderId">Tender ID</Label>
                <Input id="tenderId" value={formData.tenderId} onChange={(e) => setFormData({ ...formData, tenderId: e.target.value })} disabled={loading} className="font-mono" />
                <p className="text-xs text-muted-foreground">Auto-generated. You can customize it.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" placeholder="e.g. Supply of 500 Laptops for Government Offices" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} disabled={loading} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" placeholder="Provide a detailed description of what you're procuring..." rows={5} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} disabled={loading} required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (INR) *</Label>
                <Input id="budget" type="number" placeholder="e.g. 5000000" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} disabled={loading} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline *</Label>
                <Input id="deadline" type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} disabled={loading} required />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Required Documents</Label>
              <p className="text-sm text-muted-foreground">Select the documents sellers must submit with their bids.</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ALL_DOC_TYPES.map((docType) => (
                  <div key={docType} className="flex items-center space-x-2">
                    <Checkbox id={docType} checked={formData.requiredDocuments.includes(docType)} onCheckedChange={() => toggleDocument(docType)} disabled={loading} />
                    <Label htmlFor={docType} className="text-sm font-normal cursor-pointer">{DOC_TYPE_LABELS[docType]}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/dashboard/buyer"><Button type="button" variant="outline" disabled={loading}>Cancel</Button></Link>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {loading ? 'Posting...' : 'Post Tender'}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
