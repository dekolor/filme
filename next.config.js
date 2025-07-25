/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      { hostname: "*.cinemacity.ro" },
      { hostname: "picsum.photos" },
    ],
    formats: ['image/webp', 'image/avif'],
  },
};

export default config;
