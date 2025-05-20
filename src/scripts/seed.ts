// re-runnable

import { PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

const isoDate = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD
const isoDateTime = (d: Date) => d.toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss

async function main() {
  // cleanup db
  await prisma.movieEvent.deleteMany({});
  await prisma.movie.deleteMany({});
  await prisma.cinema.deleteMany({});

  // cinemas
  await prisma.cinema.createMany({
    data: [
      {
        id: 1,
        groupId: "CINEPLEX",
        displayName: "Cineplex Downtown",
        link: "https://example.com/cinemas/1",
        imageUrl: "https://picsum.photos/seed/cinem1/400/600",
        address: "123 Main St, Test City",
        bookingUrl: "https://example.com/booking/1",
        blockOnlineSales: false,
        latitude: 44.432777,
        longitude: 26.104444,
      },
      {
        id: 2,
        groupId: "MOONLIGHT",
        displayName: "Moonlight Cinema",
        link: "https://example.com/cinemas/2",
        imageUrl: "https://picsum.photos/seed/cinem2/400/600",
        address: "456 Side Ave, Test City",
        bookingUrl: "https://example.com/booking/2",
        blockOnlineSales: true,
        blockOnlineSalesUntil: new Date("2099-12-31T23:59:59Z"), // arbitrary far future so it never intersects tests
        latitude: 44.438333,
        longitude: 26.102222,
      },
      {
        id: 3,
        groupId: "RIVERSIDE",
        displayName: "Riverside Theaters",
        link: "https://example.com/cinemas/3",
        imageUrl: "https://picsum.photos/seed/cinem3/400/600",
        address: "789 River Rd, Test City",
        bookingUrl: "https://example.com/booking/3",
        blockOnlineSales: false,
        latitude: 44.43,
        longitude: 26.1,
      },
    ],
  });

  const now = new Date();
  const oneWeekLater = new Date(now);
  oneWeekLater.setDate(now.getDate() + 7);

  // movies
  await prisma.movie.createMany({
    data: [
      {
        id: "MOV1",
        name: "The Adventures of ChatGPT",
        length: 120,
        posterLink: "https://picsum.photos/seed/movie1/400/600",
        videoLink: null,
        link: "https://example.com/movies/mov1",
        weight: 1,
        releaseYear: "2024",
        releaseDate: "2024-11-15",
        attributeIds: ["2D", "EN"],
        imdbId: "tt1234567",
        description: "A thrilling story of an AI side-kick.",
        tmdbPopularity: 123.45,
      },
      {
        id: "MOV2",
        name: "Neon Nights",
        length: 95,
        posterLink: "https://picsum.photos/seed/movie2/400/600",
        videoLink: "https://youtube.com/watch?v=abcd1234",
        link: "https://example.com/movies/mov2",
        weight: 2,
        releaseYear: "2023",
        releaseDate: "2023-10-01",
        attributeIds: ["2D", "RO"],
        imdbId: "tt7654321",
        description: "Mystery thriller set in futuristic Bucharest.",
        tmdbPopularity: 98.7,
      },
      {
        id: "MOV3",
        name: "Debugging Daydreams",
        length: 110,
        posterLink: "https://picsum.photos/seed/movie3/400/600",
        videoLink: null,
        link: "https://example.com/movies/mov3",
        weight: 3,
        releaseYear: "2025",
        releaseDate: "2025-02-14",
        attributeIds: ["3D", "EN"],
        imdbId: null,
        description: "A quirky comedy about a developer lost in code.",
        tmdbPopularity: 76.3,
      },
      {
        id: "MOVF1",
        name: "Time Travellers: The Premiere",
        length: 105,
        posterLink: "https://picsum.photos/seed/future/400/600",
        videoLink: null,
        link: "https://example.com/movies/movf1",
        weight: 4,
        releaseYear: String(oneWeekLater.getFullYear()),
        releaseDate: isoDate(oneWeekLater),
        attributeIds: ["2D", "EN", "PREMIERE"],
        imdbId: null,
        description:
          "Brand-new sci-fi adventure — releasing one week from now.",
        tmdbPopularity: 1.0,
      },
    ],
  });

  // events
  await prisma.movieEvent.createMany({
    data: [
      {
        id: "EV1",
        filmId: "MOV1",
        cinemaId: 1,
        businessDay: DateTime.now().plus({ days: 1 }).toFormat('yyyy-MM-dd'),
        eventDateTime: DateTime.now().plus({ days: 1 }).set({ hour: 18, minute: 0 }).toISO(),
        attributes: ["SUB", "2D"],
        bookingLink: "https://example.com/booking/ev1",
        secondaryBookingLink: null,
        presentationCode: "2D",
        soldOut: false,
        auditorium: "Main Hall",
        auditoriumTinyName: "MH",
      },
      {
        id: "EV2",
        filmId: "MOV1",
        cinemaId: 2,
        businessDay: DateTime.now().plus({ days: 1 }).toFormat('yyyy-MM-dd'),
        eventDateTime: DateTime.now().plus({ days: 1 }).set({ hour: 20, minute: 30 }).toISO(),
        attributes: ["SUB", "2D"],
        bookingLink: "https://example.com/booking/ev2",
        secondaryBookingLink: null,
        presentationCode: "2D",
        soldOut: false,
        auditorium: "Room Alpha",
        auditoriumTinyName: "A",
      },
      {
        id: "EV3",
        filmId: "MOV2",
        cinemaId: 3,
        businessDay: DateTime.now().plus({ days: 1 }).toFormat('yyyy-MM-dd'),
        eventDateTime: DateTime.now().plus({ days: 1 }).set({ hour: 19, minute: 0 }).toISO(),
        attributes: ["RO"],
        bookingLink: "https://example.com/booking/ev3",
        secondaryBookingLink: null,
        presentationCode: "2D",
        soldOut: false,
        auditorium: "River Hall",
        auditoriumTinyName: "RH",
      },
      {
        id: "EV4",
        filmId: "MOV3",
        cinemaId: 1,
        businessDay: DateTime.now().plus({ days: 1 }).toFormat('yyyy-MM-dd'),
        eventDateTime: DateTime.now().plus({ days: 1 }).set({ hour: 16, minute: 45 }).toISO(),
        attributes: ["EN", "3D"],
        bookingLink: "https://example.com/booking/ev4",
        secondaryBookingLink: null,
        presentationCode: "3D",
        soldOut: false,
        auditorium: "Main Hall",
        auditoriumTinyName: "MH",
      },
      {
        id: "EV5",
        filmId: "MOV3",
        cinemaId: 2,
        businessDay: DateTime.now().plus({ days: 1 }).toFormat('yyyy-MM-dd'),
        eventDateTime: DateTime.now().plus({ days: 1 }).set({ hour: 21, minute: 15 }).toISO(),
        attributes: ["EN", "3D"],
        bookingLink: "https://example.com/booking/ev5",
        secondaryBookingLink: "https://example.com/booking-alt/ev5",
        presentationCode: "3D",
        soldOut: true,
        auditorium: "Room Beta",
        auditoriumTinyName: "B",
      },
      {
        id: "EVF1",
        filmId: "MOVF1",
        cinemaId: 1,
        businessDay: isoDate(oneWeekLater),
        eventDateTime: isoDateTime(
          new Date(
            oneWeekLater.getFullYear(),
            oneWeekLater.getMonth(),
            oneWeekLater.getDate(),
            19,
            0,
            0,
          ),
        ),
        attributes: ["PREMIERE", "EN"],
        bookingLink: "https://example.com/booking/evf1",
        secondaryBookingLink: null,
        presentationCode: "2D",
        soldOut: false,
        auditorium: "Main Hall",
        auditoriumTinyName: "MH",
      },
    ],
  });

  console.log(`Seeding staging db — ${isoDate(now)}`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
