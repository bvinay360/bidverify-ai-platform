import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type MetricCardProps = {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
};

const variantStyles = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

export function MetricCard({ title, value, icon: Icon, trend, variant = 'default' }: MetricCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow animate-fade-up">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <p className="mt-1 text-xs text-muted-foreground">{trend}</p>
            )}
          </div>
          <div className={cn('inline-flex h-12 w-12 items-center justify-center rounded-xl', variantStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
