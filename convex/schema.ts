import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  cinemas: defineTable({
    // Use externalId to store original numeric ID from Cinema City API
    externalId: v.number(),
    groupId: v.string(),
    displayName: v.string(),
    link: v.string(),
    imageUrl: v.string(),
    address: v.string(),
    bookingUrl: v.optional(v.string()),
    blockOnlineSales: v.boolean(),
    blockOnlineSalesUntil: v.optional(v.number()), // Timestamp in milliseconds
    latitude: v.float64(),
    longitude: v.float64(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_displayName", ["displayName"]),

  movies: defineTable({
    // Use externalId to store original string ID from Cinema City API
    externalId: v.string(),
    name: v.string(),
    length: v.number(),
    posterLink: v.string(),
    videoLink: v.optional(v.string()),
    link: v.string(),
    weight: v.number(),
    releaseYear: v.optional(v.string()),
    releaseDate: v.string(), // ISO date string (YYYY-MM-DD)
    attributeIds: v.array(v.string()), // Native array (was JSON string in Prisma)
    imdbId: v.optional(v.string()),
    description: v.optional(v.string()),
    tmdbPopularity: v.optional(v.float64()),
  })
    .index("by_externalId", ["externalId"])
    .index("by_name", ["name"])
    .index("by_tmdbPopularity", ["tmdbPopularity"])
    .index("by_releaseDate", ["releaseDate"])
    .index("by_popularity_and_date", ["tmdbPopularity", "releaseDate"]),

  movieEvents: defineTable({
    externalId: v.string(),
    filmExternalId: v.string(), // References movie.externalId
    cinemaExternalId: v.number(), // References cinema.externalId
    businessDay: v.string(), // ISO date string (YYYY-MM-DD)
    eventDateTime: v.string(), // ISO datetime string
    attributes: v.array(v.string()), // Native array (was JSON string in Prisma)
    bookingLink: v.string(),
    secondaryBookingLink: v.optional(v.string()),
    presentationCode: v.string(),
    soldOut: v.boolean(),
    auditorium: v.string(),
    auditoriumTinyName: v.string(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_cinemaExternalId", ["cinemaExternalId"])
    .index("by_filmExternalId", ["filmExternalId"])
    .index("by_businessDay", ["businessDay"])
    .index("by_businessDay_and_film", ["businessDay", "filmExternalId"])
    .index("by_businessDay_and_cinema", ["businessDay", "cinemaExternalId"]),
});
