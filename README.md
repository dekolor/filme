# MovieTime 🎬

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/dekolor/filme/actions/workflows/playwright.yml/badge.svg)](https://github.com/dekolor/filme/actions/workflows/playwright.yml)
[![Live Demo](https://img.shields.io/badge/Live-Demo-green)](https://filme.dekolor.ro)

A modern web app for discovering movies and showtimes at all Cinema City locations across Romania. Designed for fast, real-world usage with automatic nightly data updates and end-to-end testing.

---

## Features

* **Up-to-date Showtimes:** Fetches and displays current and upcoming movies for every cinema in the Cinema City network in Romania. Data is automatically refreshed every night.
* **Movie Search:** Quickly find movies by title. (Further filters/search improvements coming soon!)
* **Detailed Movie Pages:** Get runtime, description, showtimes, and all available formats (dubbed/subbed, languages, 3D, etc).
* **Cinema Pages:** See all movies and all showtimes for each cinema, plus useful info.
* **Responsive Modern UI:** Looks and works great on desktop and mobile.
* **Automated E2E Testing:** Key user flows are covered with Playwright.
* **Dev/Staging/Production environments:** Fully cloud-hosted with Vercel and Neon.

## Upcoming (WIP)

* **Seat Availability Tracking:**
  My original inspiration—see at a glance how full a screening is. Planned as the next feature, opening up further possibilities like:

  * Seat-based notifications
  * “Find movies with available seats now” search

---

## Tech Stack

* **Frontend:** Next.js, React, TypeScript, TailwindCSS
* **Backend:** Node.js (API routes), Prisma ORM, PostgreSQL (Neon)
* **Testing:** Playwright (E2E)
* **Hosting:** Vercel (dev/staging/prod), Neon (DB)

---

## Screenshots

> ![Home Page](https://i.imgur.com/2sshnSg.jpeg)
> ![Movie Details](https://i.imgur.com/lHvV7jb.png)
> ![Cinema Page](https://i.imgur.com/CIao6WM.png)

---

## How it works

Every night at 2 AM, MovieTime fetches showtime data from Cinema City Romania, parses the schedule, and updates the database automatically. Users can browse all current and upcoming movies, view showtimes by cinema, and quickly find info about films and locations—all from a single, user-friendly interface.

---

## Running Locally

```bash
git clone https://github.com/dekolor/filme
cd filme
npm install
npm dev
# Copy .env.example to .env and fill in your Neon/Postgres DB connection
```

---

## Why I Built This

> “Romanian moviegoers had to check multiple cinema websites to find showtimes and available seats. I wanted to simplify this by aggregating the info and making seat availability visible at a glance. The project became a full-stack learning journey—data scraping, API automation, database modeling, frontend UX, and robust testing.”

