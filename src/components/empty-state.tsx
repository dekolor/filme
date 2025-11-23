import { Film, Calendar, MapPin } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({
  icon: Icon = Film,
  title,
  description
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 rounded-full bg-muted p-6">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-sm text-sm">
        {description}
      </p>
    </div>
  );
}

export const MovieEmptyState = () => (
  <EmptyState
    icon={Film}
    title="No movies found"
    description="Check back soon for the latest movies and showtimes!"
  />
);

export const UpcomingMovieEmptyState = () => (
  <EmptyState
    icon={Calendar}
    title="No upcoming movies"
    description="Stay tuned for exciting new releases coming to theaters near you!"
  />
);

export const CinemaEmptyState = () => (
  <EmptyState
    icon={MapPin}
    title="No cinemas available"
    description="We're working on adding more cinema locations. Check back soon!"
  />
);
