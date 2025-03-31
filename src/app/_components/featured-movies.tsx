"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Clock, Star } from "lucide-react";
// Mock data for movies
const movies = {
  "now-showing": [
    {
      id: "dune-part-two",
      title: "Dune: Part Two",
      image: "https://picsum.photos/300/400",
      rating: "PG-13",
      duration: "166 min",
      score: 8.7,
    },
    {
      id: "poor-things",
      title: "Poor Things",
      image: "https://picsum.photos/300/400",
      rating: "R",
      duration: "141 min",
      score: 8.4,
    },
    {
      id: "the-fall-guy",
      title: "The Fall Guy",
      image: "https://picsum.photos/300/400",
      rating: "PG-13",
      duration: "126 min",
      score: 7.8,
    },
    {
      id: "godzilla-x-kong",
      title: "Godzilla x Kong",
      image: "https://picsum.photos/300/400",
      rating: "PG-13",
      duration: "115 min",
      score: 7.5,
    },
  ],
  "coming-soon": [
    {
      id: "deadpool-wolverine",
      title: "Deadpool & Wolverine",
      image: "https://picsum.photos/300/400",
      rating: "R",
      duration: "TBA",
      score: null,
    },
    {
      id: "inside-out-2",
      title: "Inside Out 2",
      image: "https://picsum.photos/300/400",
      rating: "PG",
      duration: "TBA",
      score: null,
    },
    {
      id: "furiosa",
      title: "Furiosa",
      image: "https://picsum.photos/300/400",
      rating: "R",
      duration: "148 min",
      score: null,
    },
    {
      id: "a-quiet-place-day-one",
      title: "A Quiet Place: Day One",
      image: "https://picsum.photos/300/400",
      rating: "PG-13",
      duration: "TBA",
      score: null,
    },
  ],
};

export default function FeaturedMovies() {
  const [activeTab, setActiveTab] = useState("now-showing");

  return (
    <section>
      <Tabs defaultValue="now-showing" onValueChange={setActiveTab}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Movies</h2>
          <TabsList>
            <TabsTrigger value="now-showing">Now Showing</TabsTrigger>
            <TabsTrigger value="coming-soon">Coming Soon</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="now-showing" className="mt-0">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {movies["now-showing"].map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="coming-soon" className="mt-0">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {movies["coming-soon"].map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function MovieCard({ movie }: { movie: any }) {
  return (
    <Card className="group overflow-hidden">
      <Link href={`/movies/${movie.id}`}>
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={movie.image || "/placeholder.svg"}
            alt={movie.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute top-2 left-2">
            <Badge variant="secondary">{movie.rating}</Badge>
          </div>
          {movie.score && (
            <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-md bg-yellow-500 px-1.5 py-0.5 text-xs font-medium text-black">
              <Star className="h-3 w-3 fill-black" />
              {movie.score}
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="line-clamp-1 font-semibold">{movie.title}</h3>
          <div className="text-muted-foreground mt-1 flex items-center text-xs">
            <Clock className="mr-1 h-3 w-3" />
            {movie.duration}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
