import Link from 'next/link';
import { ShieldCheck, FileSearch, Gauge, AlertTriangle, ArrowRight, Building2, Lock, BarChart3, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-primary/95 backdrop-blur supports-[backdrop-filter]:bg-primary/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-white" />
            <span className="text-xl font-bold text-white">BidVerify AI</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-white/80 hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm text-white/80 hover:text-white transition-colors">How It Works</Link>
            <Link href="#stats" className="text-sm text-white/80 hover:text-white transition-colors">Impact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button variant="secondary" className="bg-white text-primary hover:bg-white/90">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 bg-white/10 text-white border-white/20 backdrop-blur">
              <ShieldCheck className="mr-2 h-3.5 w-3.5" />
              Government e-Marketplace Compliance
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl text-balance">
              AI-Driven Compliance for Smarter Procurement
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
              Automatically verify bidder information and documents — GSTN, Udyam, BIS/IS certificates, PAN —
              for consistency, completeness, and compliance with GeM tender requirements.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Wave separator */}
        <div className="relative">
          <svg className="w-full" viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L60 70C120 60 240 40 360 35C480 30 600 40 720 45C840 50 960 50 1080 45C1200 40 1320 30 1380 25L1440 20V80H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            The Challenge in Public Procurement
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Manual verification of bid documents is slow, error-prone, and inconsistent. Procurement officers
            spend hours checking GSTN numbers, Udyam registrations, BIS certificates, and PAN details across
            hundreds of bids — leading to delays, missed inconsistencies, and potential compliance gaps that
            undermine procurement integrity.
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="container mx-auto px-4 pb-16 md:pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="group border-2 hover:border-primary/30 hover:shadow-lg transition-all duration-300 animate-fade-up">
            <CardContent className="pt-6">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <FileSearch className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">AI Document Verification</h3>
              <p className="mt-2 text-muted-foreground">
                OCR-powered extraction of key fields from GST certificates, PAN cards, Udyam registrations,
                and BIS certificates. Automatic data validation against government databases.
              </p>
            </CardContent>
          </Card>

          <Card className="group border-2 hover:border-success/30 hover:shadow-lg transition-all duration-300 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="pt-6">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-success/10 text-success group-hover:scale-110 transition-transform">
                <Gauge className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Automated Compliance Scoring</h3>
              <p className="mt-2 text-muted-foreground">
                A 0-100% compliance score is calculated for each bid based on document completeness,
                data consistency, and verification results — reducing manual effort by up to 80%.
              </p>
            </CardContent>
          </Card>

          <Card className="group border-2 hover:border-warning/30 hover:shadow-lg transition-all duration-300 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <CardContent className="pt-6">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-warning/10 text-warning group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Risk Assessment</h3>
              <p className="mt-2 text-muted-foreground">
                Each bid is flagged as Low, Medium, or High risk based on compliance findings.
                Missing documents, name mismatches, and expired certificates are automatically detected.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How It Works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {[
              { icon: Building2, title: 'Post Tender', desc: 'Buyers post tenders with required document specifications on the platform.' },
              { icon: FileSearch, title: 'Submit Bids', desc: 'Sellers upload their documents and submit bids with supporting certificates.' },
              { icon: Gauge, title: 'AI Verification', desc: 'The platform runs automated OCR, data extraction, and cross-document checks.' },
              { icon: CheckCircle2, title: 'Review & Approve', desc: 'Buyers review compliance scores, risk levels, and detailed findings to make decisions.' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                  {i + 1}
                </div>
                <step.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { value: '80%', label: 'Reduction in manual verification effort' },
            { value: '< 2 min', label: 'Average compliance check time per bid' },
            { value: '15+', label: 'Document types automatically verified' },
            { value: '99.5%', label: 'OCR data extraction accuracy' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-bold text-primary md:text-5xl">{stat.value}</div>
              <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Transform Your Procurement Process?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Join the platform that's making government procurement faster, fairer, and more transparent.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Create an Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Sign In to Your Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-7 w-7 text-primary" />
                <span className="text-lg font-bold text-foreground">BidVerify AI</span>
              </div>
              <p className="mt-4 max-w-md text-sm text-muted-foreground">
                AI-Powered Integrated Bid Compliance Verification Platform for GeM procurement in India.
                Reducing manual verification effort and improving procurement integrity.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>Bank-grade security &amp; encryption</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Platform</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-foreground transition-colors">Create Account</Link></li>
                <li><Link href="/tenders" className="hover:text-foreground transition-colors">Browse Tenders</Link></li>
                <li><Link href="/reports" className="hover:text-foreground transition-colors">Reports</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Resources</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
                <li><Link href="#stats" className="hover:text-foreground transition-colors">Impact</Link></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Documentation</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 BidVerify AI. Built for Government e-Marketplace procurement integrity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
