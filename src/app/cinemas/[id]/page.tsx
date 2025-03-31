import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { MapPin, Phone, Clock, Calendar } from "lucide-react";
import { api } from "~/trpc/react";
import Cinema from "~/app/_components/cinema";

export default async function CinemaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="bg-background min-h-screen">
      <header className="text-secondary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold">
              MovieTime
            </Link>
          </div>
        </div>
      </header>

      <Cinema cinemaId={id} />
    </div>
  );
}
