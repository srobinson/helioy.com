import "./style.css";
import { initS3 } from "./s3";
import posthog from "posthog-js";

// ── S³ visualization ────────────────────────────
const canvas = document.getElementById("s3") as HTMLCanvasElement;
if (canvas) initS3(canvas);

// ── Canvas fade on scroll ───────────────────────
const hero = document.querySelector(".hero") as HTMLElement;
if (canvas && hero) {
  window.addEventListener(
    "scroll",
    () => {
      const progress = Math.min(window.scrollY / hero.offsetHeight, 1);
      canvas.style.opacity = String(1 - progress * 0.9);
    },
    { passive: true },
  );
}

// ── Reveal on scroll ────────────────────────────
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    }
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

posthog.init("phc_TMDFaW5UswKttn4RRayRwg5o6MVw4Enoz1vCMjaQIPK", {
  api_host: "https://eu.i.posthog.com",
  defaults: "2026-01-30",
});

// ── Link click tracking ─────────────────────────
document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
  link.addEventListener("click", () => {
    const tool = link.closest(".tool");
    const category = tool?.querySelector(".tool-category")?.textContent?.trim();
    posthog.capture("link_clicked", {
      url: link.href,
      text: link.textContent?.trim(),
      section: category ?? (link.closest(".cta") ? "cta" : "other"),
    });
  });
});
