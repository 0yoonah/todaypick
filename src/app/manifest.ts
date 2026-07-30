import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TodayPick",
    short_name: "TodayPick",
    description: "하루 10분, IT 전문가로 성장하는 학습 루틴",
    start_url: "/",
    display: "standalone",
    background_color: "#fff",
    theme_color: "#4263C7",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
