-- CreateTable
CREATE TABLE "Cinema" (
    "id" INTEGER NOT NULL,
    "groupId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "bookingUrl" TEXT,
    "blockOnlineSales" BOOLEAN NOT NULL DEFAULT false,
    "blockOnlineSalesUntil" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Cinema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movie" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "length" INTEGER NOT NULL,
    "posterLink" TEXT NOT NULL,
    "videoLink" TEXT,
    "link" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "releaseYear" TEXT,
    "releaseDate" TEXT NOT NULL,
    "attributeIds" TEXT NOT NULL,
    "imdbId" TEXT,
    "description" TEXT,
    "tmdbPopularity" DOUBLE PRECISION,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovieEvent" (
    "id" TEXT NOT NULL,
    "filmId" TEXT NOT NULL,
    "cinemaId" INTEGER NOT NULL,
    "businessDay" TEXT NOT NULL,
    "eventDateTime" TEXT NOT NULL,
    "attributes" TEXT NOT NULL,
    "bookingLink" TEXT NOT NULL,
    "secondaryBookingLink" TEXT,
    "presentationCode" TEXT NOT NULL,
    "soldOut" BOOLEAN NOT NULL DEFAULT false,
    "auditorium" TEXT NOT NULL,
    "auditoriumTinyName" TEXT NOT NULL,

    CONSTRAINT "MovieEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Movie_tmdbPopularity_idx" ON "Movie"("tmdbPopularity");

-- CreateIndex
CREATE INDEX "Movie_releaseDate_idx" ON "Movie"("releaseDate");

-- CreateIndex
CREATE INDEX "Movie_tmdbPopularity_releaseDate_idx" ON "Movie"("tmdbPopularity", "releaseDate");

-- CreateIndex
CREATE INDEX "MovieEvent_cinemaId_idx" ON "MovieEvent"("cinemaId");

-- CreateIndex
CREATE INDEX "MovieEvent_filmId_idx" ON "MovieEvent"("filmId");

-- CreateIndex
CREATE INDEX "MovieEvent_businessDay_idx" ON "MovieEvent"("businessDay");

-- CreateIndex
CREATE INDEX "MovieEvent_businessDay_filmId_idx" ON "MovieEvent"("businessDay", "filmId");

-- CreateIndex
CREATE INDEX "MovieEvent_businessDay_cinemaId_idx" ON "MovieEvent"("businessDay", "cinemaId");

-- AddForeignKey
ALTER TABLE "MovieEvent" ADD CONSTRAINT "MovieEvent_cinemaId_fkey" FOREIGN KEY ("cinemaId") REFERENCES "Cinema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieEvent" ADD CONSTRAINT "MovieEvent_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
