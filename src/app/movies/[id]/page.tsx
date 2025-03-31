import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Clock, Calendar, Star, MapPin } from "lucide-react";

// Mock movie data function
function getMovie(id: string) {
  // In a real app, this would fetch from an API
  const movies = {
    "dune-part-two": {
      id: "dune-part-two",
      title: "Dune: Part Two",
      image: "https://picsum.photos/600/400",
      rating: "PG-13",
      duration: "166 min",
      releaseDate: "March 1, 2024",
      genres: ["Sci-Fi", "Adventure", "Drama"],
      director: "Denis Villeneuve",
      cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Josh Brolin"],
      score: 8.7,
      synopsis:
        "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. As he tries to prevent a terrible future, he must reconcile the love of his life with the fate of the universe.",
      showtimes: {
        "cineplex-downtown": [
          { time: "10:30 AM", format: "Standard" },
          { time: "1:45 PM", format: "IMAX" },
          { time: "5:00 PM", format: "Standard" },
          { time: "8:15 PM", format: "IMAX" },
          { time: "11:30 PM", format: "Standard" },
        ],
        "amc-metropolis": [
          { time: "11:00 AM", format: "Standard" },
          { time: "2:30 PM", format: "Dolby" },
          { time: "6:00 PM", format: "Standard" },
          { time: "9:30 PM", format: "Dolby" },
        ],
        "regal-city-center": [
          { time: "10:00 AM", format: "Standard" },
          { time: "1:15 PM", format: "RPX" },
          { time: "4:30 PM", format: "Standard" },
          { time: "7:45 PM", format: "RPX" },
          { time: "11:00 PM", format: "Standard" },
        ],
      },
    },
    "poor-things": {
      id: "poor-things",
      title: "Poor Things",
      image: "https://picsum.photos/600/400",
      rating: "R",
      duration: "141 min",
      releaseDate: "December 8, 2023",
      genres: ["Comedy", "Drama", "Sci-Fi"],
      director: "Yorgos Lanthimos",
      cast: ["Emma Stone", "Mark Ruffalo", "Willem Dafoe", "Ramy Youssef"],
      score: 8.4,
      synopsis:
        "The incredible tale about the fantastical evolution of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter. Under Baxter's protection, Bella is eager to learn. Hungry for the worldliness she is lacking, Bella runs off with Duncan Wedderburn, a slick and debauched lawyer, on a whirlwind adventure across the continents.",
      showtimes: {
        "cineplex-downtown": [
          { time: "11:15 AM", format: "Standard" },
          { time: "2:45 PM", format: "Standard" },
          { time: "6:15 PM", format: "Standard" },
          { time: "9:45 PM", format: "Standard" },
        ],
        "amc-metropolis": [
          { time: "12:00 PM", format: "Standard" },
          { time: "3:30 PM", format: "Standard" },
          { time: "7:00 PM", format: "Standard" },
          { time: "10:30 PM", format: "Standard" },
        ],
        "regal-city-center": [
          { time: "11:30 AM", format: "Standard" },
          { time: "3:00 PM", format: "Standard" },
          { time: "6:30 PM", format: "Standard" },
          { time: "10:00 PM", format: "Standard" },
        ],
      },
    },
    "the-fall-guy": {
      id: "the-fall-guy",
      title: "The Fall Guy",
      image: "https://picsum.photos/600/400",
      rating: "PG-13",
      duration: "126 min",
      releaseDate: "May 3, 2024",
      genres: ["Action", "Comedy"],
      director: "David Leitch",
      cast: [
        "Ryan Gosling",
        "Emily Blunt",
        "Aaron Taylor-Johnson",
        "Hannah Waddingham",
      ],
      score: 7.8,
      synopsis:
        "Colt Seavers, a battle-scarred stuntman who, having left the business a year earlier to focus on both his physical and mental health, is drafted back into service when the star of a mega-budget studio movie—being directed by his ex, Jody Moreno—goes missing.",
      showtimes: {
        "cineplex-downtown": [
          { time: "10:45 AM", format: "Standard" },
          { time: "1:30 PM", format: "Standard" },
          { time: "4:15 PM", format: "Standard" },
          { time: "7:00 PM", format: "Standard" },
          { time: "9:45 PM", format: "Standard" },
        ],
        "amc-metropolis": [
          { time: "11:30 AM", format: "Standard" },
          { time: "2:15 PM", format: "Standard" },
          { time: "5:00 PM", format: "Standard" },
          { time: "7:45 PM", format: "Standard" },
          { time: "10:30 PM", format: "Standard" },
        ],
        "regal-city-center": [
          { time: "12:15 PM", format: "Standard" },
          { time: "3:00 PM", format: "Standard" },
          { time: "5:45 PM", format: "Standard" },
          { time: "8:30 PM", format: "Standard" },
        ],
      },
    },
  };

  return movies[id] || null;
}

export default function MoviePage({ params }: { params: { id: string } }) {
  const movie = getMovie(params.id);

  if (!movie) {
    notFound();
  }

  const cinemas = Object.keys(movie.showtimes).map((id) => ({
    id,
    name: id
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
  }));

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

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="md:w-1/3 lg:w-1/4">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-md">
              <Image
                src={movie.image || "/placeholder.svg"}
                alt={movie.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          <div className="md:w-2/3 lg:w-3/4">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <h1 className="text-3xl font-bold">{movie.title}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{movie.rating}</Badge>
                {movie.score && (
                  <div className="flex items-center gap-1 rounded-md bg-yellow-500 px-2 py-1 text-sm font-medium text-black">
                    <Star className="h-4 w-4 fill-black" />
                    {movie.score}
                  </div>
                )}
              </div>
            </div>

            <div className="text-muted-foreground mb-6 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                {movie.duration}
              </div>
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                {movie.releaseDate}
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <Badge key={genre} variant="secondary">
                  {genre}
                </Badge>
              ))}
            </div>

            <div className="mb-6">
              <h2 className="mb-2 font-semibold">Synopsis</h2>
              <p>{movie.synopsis}</p>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-6">
              <div>
                <h2 className="mb-2 font-semibold">Director</h2>
                <p>{movie.director}</p>
              </div>
              <div>
                <h2 className="mb-2 font-semibold">Cast</h2>
                <ul className="space-y-1">
                  {movie.cast.map((actor) => (
                    <li key={actor}>{actor}</li>
                  ))}
                </ul>
              </div>
            </div>

            <h2 className="mb-6 text-2xl font-bold">Showtimes</h2>

            <Tabs defaultValue={cinemas[0].id}>
              <TabsList className="mb-4">
                {cinemas.map((cinema) => (
                  <TabsTrigger key={cinema.id} value={cinema.id}>
                    {cinema.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {cinemas.map((cinema) => (
                <TabsContent key={cinema.id} value={cinema.id}>
                  <Card>
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center gap-2">
                        <MapPin className="text-muted-foreground h-5 w-5" />
                        <h3 className="font-semibold">{cinema.name}</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {movie.showtimes[cinema.id].map((showtime, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="flex h-auto flex-col py-3"
                          >
                            <span>{showtime.time}</span>
                            <span className="text-muted-foreground mt-1 text-xs">
                              {showtime.format}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
