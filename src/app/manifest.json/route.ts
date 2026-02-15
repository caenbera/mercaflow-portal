
import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    name: "MercaFlow Portal",
    short_name: "MercaFlow",
    description: "Ecosistema de productos frescos al por mayor para la comunidad latina.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#27ae60",
    icons: [
      { src: "/favicon.ico", sizes: "16x16", type: "image/x-icon" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  };

  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/json' }
  });
}
