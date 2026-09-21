'use client';

import { useState } from 'react';
import { User, Building2, Mail, Phone, Lock, Bell, Shield, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: profile?.name ?? '',
    organization: profile?.organization ?? '',
    phone: profile?.phone ?? '',
    email: profile?.email ?? '',
  });
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [notifications, setNotifications] = useState({ email: true, bidUpdates: true, riskAlerts: true, weeklyReports: false });

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        name: formData.name,
        organization: formData.organization,
        phone: formData.phone,
      })
      .eq('id', profile.id);

    if (error) {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    } else {
      await refreshProfile();
      toast({ title: 'Profile Updated', description: 'Your profile has been saved.' });
    }
    setSavingProfile(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      toast({ title: 'Error', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    if (passwordData.new.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwordData.new });
    if (error) {
      toast({ title: 'Password Change Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password Changed', description: 'Your password has been updated.' });
      setPasswordData({ current: '', new: '', confirm: '' });
    }
    setSavingPassword(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile &amp; Settings</h1>
        <p className="text-muted-foreground">Manage your account information and preferences.</p>
      </div>

      {/* Profile Info */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Update your personal and organization details.</CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileSave}>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 pb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {profile?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-semibold text-foreground">{profile?.name || 'User'}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={profile?.role === 'BUYER' ? 'default' : 'secondary'}>{profile?.role}</Badge>
                  {profile?.is_verified && (
                    <Badge variant="outline" className="border-success text-success">
                      <Shield className="mr-1 h-3 w-3" />Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="name" className="pl-9" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={savingProfile} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="organization" className="pl-9" value={formData.organization} onChange={(e) => setFormData({ ...formData, organization: e.target.value })} disabled={savingProfile} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email (read-only)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" className="pl-9 bg-muted" value={formData.email} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" className="pl-9" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} disabled={savingProfile} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* Change Password */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordChange}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="newPassword" type="password" className="pl-9" value={passwordData.new} onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })} disabled={savingPassword} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="confirmPassword" type="password" className="pl-9" value={passwordData.confirm} onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })} disabled={savingPassword} />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="outline" disabled={savingPassword}>
                {savingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update Password
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* Notification Preferences */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose what updates you want to receive.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
            { key: 'bidUpdates', label: 'Bid Updates', desc: 'Get notified when bid status changes' },
            { key: 'riskAlerts', label: 'Risk Alerts', desc: 'Immediate alerts for high-risk bids' },
            { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Summary of compliance activity every week' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <Switch
                checked={notifications[item.key as keyof typeof notifications]}
                onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
