"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Film as FilmIcon,
  LoaderCircle,
  Moon,
  RotateCw,
  Sparkles,
} from "lucide-react";
import type { Film } from "../lib/catalog";
import {
  buildRecommendationChoices,
  pickRecommendation,
  recommendationIdentity,
  type DiscoveryMode,
  type RuntimeChoice,
} from "../lib/recommendation";

type Mood = "unwind" | "learn" | "hyped" | "feel" | "escape";
type Delivery = "hooked" | "soak" | "brain" | "simple";
type Visual = "energy" | "raw" | "composed" | "grounded";
const discoveryModes: { id: DiscoveryMode; label: string; hint: string }[] = [
  { id: "balanced", label: "Balanced mix", hint: "A little of everything" },
  { id: "trending", label: "Trending", hint: "What people are watching" },
  { id: "recent", label: "Recently released", hint: "Fresh from the cinema" },
  { id: "popular", label: "Popular", hint: "Crowd-pleasers" },
  { id: "top-rated", label: "Top rated (TMDB)", hint: "Vibe first, TMDB breaks ties" },
  { id: "top-rated-imdb", label: "Top rated (IMDb)", hint: "Vibe first, IMDb breaks ties" },
];
const moods: { id: Mood; label: string; icon: string; sub: string }[] = [
  { id: "unwind", label: "Unwind", icon: "☁️", sub: "Let the day go" },
  { id: "learn", label: "Get curious", icon: "◉", sub: "Feed your brain" },
  { id: "hyped", label: "Get hyped", icon: "⚡", sub: "Bring the energy" },
  { id: "feel", label: "Feel something", icon: "♡", sub: "A good kind of ache" },
  { id: "escape", label: "Get away", icon: "✳", sub: "Leave this planet" },
];
const deliveries: { id: Delivery; label: string; icon: string }[] = [
  { id: "hooked", label: "Keep me hooked", icon: "↗" },
  { id: "soak", label: "Let me soak", icon: "◌" },
  { id: "brain", label: "Melt my brain", icon: "∿" },
  { id: "simple", label: "Keep it simple", icon: "☼" },
];
const visuals: { id: Visual; label: string; hint: string; swatch: string }[] = [
  { id: "energy", label: "High energy", hint: "Kinetic & expressive", swatch: "visual-energy" },
  { id: "raw", label: "Raw & gritty", hint: "Close to the real", swatch: "visual-raw" },
  { id: "composed", label: "Precise & composed", hint: "Every frame in place", swatch: "visual-composed" },
  { id: "grounded", label: "Quiet & grounded", hint: "Room to breathe", swatch: "visual-grounded" },
];
const runtimes: { id: RuntimeChoice; label: string; hint: string }[] = [
  { id: "short", label: "Under 90 min", hint: "A quick one" },
  { id: "medium", label: "90–120 min", hint: "The sweet spot" },
  { id: "long", label: "120+ min", hint: "Room for a saga" },
  { id: "any", label: "Any length", hint: "I’m all in" },
];
const screeningStepCount = 6;

type ScreeningChoice<T extends string | boolean | null> = {
  id: T;
  label: string;
  hint?: string;
  icon?: string;
  art?: string;
  swatch?: string;
};

function ScreeningCarousel<T extends string | boolean | null>({
  items,
  selected,
  label,
  onSelect,
  disabled = false,
}: {
  items: ScreeningChoice<T>[];
  selected: T;
  label: string;
  onSelect: (choice: T) => void;
  disabled?: boolean;
}) {
  const selectedIndex = Math.max(0, items.findIndex((item) => item.id === selected));
  const [view, setView] = useState({ selected, index: selectedIndex });
  const activeIndex = view.selected === selected ? view.index : selectedIndex;
  const pointerStart = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const wheelDistance = useRef(0);
  const wheelDirection = useRef(0);
  const wheelLocked = useRef(false);
  const wheelEndTimer = useRef<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const move = useCallback((direction: number) => {
    setView((currentView) => {
      const next = (currentView.selected === selected ? currentView.index : selectedIndex) + direction;
      const index = items.length > 2
        ? (next + items.length) % items.length
        : Math.max(0, Math.min(items.length - 1, next));
      return { selected, index };
    });
  }, [items.length, selected, selectedIndex]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleWheel = (event: WheelEvent) => {
      if (disabled) return;
      const horizontalDelta = event.shiftKey && Math.abs(event.deltaX) < 1 ? event.deltaY : event.deltaX;
      const verticalDelta = event.shiftKey && Math.abs(event.deltaX) < 1 ? 0 : event.deltaY;
      if (Math.abs(horizontalDelta) < 1 || Math.abs(horizontalDelta) < Math.abs(verticalDelta) * 0.65) return;

      event.preventDefault();
      event.stopPropagation();

      if (wheelEndTimer.current !== null) window.clearTimeout(wheelEndTimer.current);
      wheelEndTimer.current = window.setTimeout(() => {
        wheelEndTimer.current = null;
        wheelDistance.current = 0;
        wheelDirection.current = 0;
        wheelLocked.current = false;
      }, 180);

      if (wheelLocked.current) return;

      const direction = Math.sign(horizontalDelta);
      if (direction !== wheelDirection.current) {
        wheelDistance.current = 0;
        wheelDirection.current = direction;
      }

      wheelDistance.current += horizontalDelta;
      if (Math.abs(wheelDistance.current) < 28) return;

      move(wheelDirection.current);
      wheelLocked.current = true;
    };

    carousel.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      carousel.removeEventListener("wheel", handleWheel);
      if (wheelEndTimer.current !== null) window.clearTimeout(wheelEndTimer.current);
    };
  }, [disabled, move]);

  return (
    <div
      ref={carouselRef}
      className="screening-carousel"
      role="region"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        }
      }}
      onPointerDown={(event) => {
        if (disabled) return;
        pointerStart.current = event.clientX;
        suppressClick.current = false;
      }}
      onPointerUp={(event) => {
        if (disabled) return;
        if (pointerStart.current === null) return;
        const distance = event.clientX - pointerStart.current;
        if (Math.abs(distance) > 45) {
          move(distance < 0 ? 1 : -1);
          suppressClick.current = true;
        }
        pointerStart.current = null;
      }}
      onPointerCancel={() => {
        pointerStart.current = null;
      }}
      onClickCapture={(event) => {
        if (suppressClick.current) {
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }
      }}
    >
      <div
        className="screening-carousel-stage"
        onClickCapture={(event) => {
          if (disabled || suppressClick.current) return;
          const cards = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(".screening-option"));
          const nearest = cards
            .map((card) => {
              const bounds = card.getBoundingClientRect();
              const x = bounds.left + bounds.width / 2;
              const y = bounds.top + bounds.height / 2;
              return { card, bounds, distance: Math.hypot(event.clientX - x, event.clientY - y) };
            })
            .filter(({ card, bounds }) => card.style.visibility !== "hidden"
              && event.clientX >= bounds.left && event.clientX <= bounds.right
              && event.clientY >= bounds.top && event.clientY <= bounds.bottom)
            .sort((a, b) => a.distance - b.distance)[0];

          if (nearest) {
            const choiceIndex = Number(nearest.card.dataset.choiceIndex);
            const choice = items[choiceIndex];
            if (choice) {
              event.preventDefault();
              event.stopPropagation();
              onSelect(choice.id);
            }
          }
        }}
      >
        {items.map((item, index) => {
          let offset = index - activeIndex;
          if (items.length > 2 && offset > items.length / 2) offset -= items.length;
          if (items.length > 2 && offset < -items.length / 2) offset += items.length;
          const distance = Math.abs(offset);
          return (
            <button
              key={String(item.id)}
              type="button"
              data-choice-index={index}
              className={`screening-option ${item.swatch ?? ""} ${item.art ? `choice-${item.art}` : ""} ${item.id === selected ? "active" : ""} ${offset === 0 ? "carousel-center" : ""}`}
              style={{
                "--card-x": `${offset * 44}%`,
                "--card-depth": `${distance * -105}px`,
                "--card-angle": `${offset * -27}deg`,
                "--card-scale": Math.max(0.72, 1 - distance * 0.13),
                  zIndex: items.length - distance,
                  visibility: distance > 1 ? "hidden" : "visible",
                  pointerEvents: distance > 1 ? "none" : "auto",
              } as React.CSSProperties}
              aria-label={`${item.label}${item.hint ? `, ${item.hint}` : ""}`}
              aria-pressed={item.id === selected}
              tabIndex={distance > 1 ? -1 : 0}
              disabled={disabled}
            >
              <span className="choice-card-kicker">{label.replace(/ choices?$/i, "")}</span>
              <span className="choice-card-art" aria-hidden="true">{item.icon ?? "✳"}</span>
              <span className="choice-card-copy"><b>{item.label}</b>{item.hint && <small>{item.hint}</small>}</span>
              <span className="choice-card-select" aria-hidden="true">{item.id === selected && <Check size={15} />}</span>
            </button>
          );
        })}
      </div>
      <div className="screening-carousel-controls">
        <span>{String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")} <i /> Two-finger swipe</span>
      </div>
    </div>
  );
}

const affirmation = (film: Film, delivery: Delivery, interrupted: boolean) => {
  let note = film.note;
  if (delivery === "hooked" && film.runtime > 115) note = "Don't stress about catching every detail on the first pass. Ride the momentum and let the speed take over.";
  if (delivery === "soak") note = "Give this film a few minutes to find its rhythm. Let the silence and space do the heavy lifting.";
  if (delivery === "brain") note = "Stop trying to solve the plot ahead of time. Surrender to the dream logic and feel the mood.";
  if (interrupted && film.interruption != null && film.interruption >= 4) note += " The story has room to pause—step away whenever you need.";
    if (interrupted && film.interruption != null && film.interruption >= 4) note += " The story has room to pause—step away whenever you need.";
  return note;
};

export default function Home() {
  const [screen, setScreen] = useState<"start" | "vibe" | "result">("start");
  const [screeningStep, setScreeningStep] = useState(0);
  const [runtime, setRuntime] = useState<RuntimeChoice>("any");
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>("balanced");
  const [interruptions, setInterruptions] = useState(false);
  const [mood, setMood] = useState<Mood | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [visual, setVisual] = useState<Visual | null>(null);
  const [current, setCurrent] = useState<Film | null>(null);
  const [excludedMovies, setExcludedMovies] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem("shrugr-excluded-movies");
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : [];
    } catch {
      return [];
    }
  });
  const [showBackups, setShowBackups] = useState(false);
  const [liveFilms, setLiveFilms] = useState<Film[]>([]);
  const [searchingLive, setSearchingLive] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const applicationJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Shrugr",
    url: "https://shrugr.de5.net/",
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Any",
    description: "A movie picker that helps people choose a film by available time, mood, and viewing vibe.",
  };

  const matches = useMemo(
    () =>
      buildRecommendationChoices({
        films: liveFilms,
        providers: [],
        runtime,
        interruptions,
        mood,
        delivery,
        visual,
        discoveryMode,
        seen: excludedMovies,
      }),
    [liveFilms, runtime, interruptions, mood, delivery, visual, discoveryMode, excludedMovies],
  );

  const chooseMovie = async (excludedTitles = excludedMovies, selectedMode = discoveryMode) => {
    setSearchingLive(true);
    setSearchError(null);
    const exclusions = (current
      ? [...new Set([...excludedTitles, recommendationIdentity(current)])]
      : excludedTitles).slice(-100);
    setExcludedMovies(exclusions);
    try { localStorage.setItem("shrugr-excluded-movies", JSON.stringify(exclusions)); } catch { /* storage is optional */ }
    try {
      const params = new URLSearchParams({ runtime, mode: selectedMode });
      const excludedIds = exclusions
        .filter((identity) => identity.startsWith("tmdb:"))
        .map((identity) => identity.slice("tmdb:".length));
      if (excludedIds.length > 0) params.set("exclude", excludedIds.join(","));
      const response = await fetch(`/api/movies?${params}`, { cache: "no-store" });
      const payload = (await response.json()) as { movies?: Film[]; source?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || `Live search returned HTTP ${response.status}.`);
      if (payload.source !== "tmdb-live") throw new Error("The movie service did not return live TMDB results.");
      if (!Array.isArray(payload.movies) || payload.movies.length === 0) {
        throw new Error("TMDB returned no usable movie records. Please try again.");
      }

      const candidates = payload.movies.map((film) => ({ ...film, isLive: true }));
      const freshMatches = buildRecommendationChoices({
        films: candidates,
        providers: [],
        runtime,
        interruptions,
        mood,
        delivery,
        visual,
        discoveryMode: selectedMode,
        seen: exclusions,
      });
      const pick = pickRecommendation(freshMatches, current);
      if (!pick) {
        throw new Error("No new live films matched your choices. Please try again or adjust your runtime.");
      }

      const nextExclusions = [...new Set([...exclusions, recommendationIdentity(pick)])].slice(-100);
      setExcludedMovies(nextExclusions);
      try { localStorage.setItem("shrugr-excluded-movies", JSON.stringify(nextExclusions)); } catch { /* storage is optional */ }
      setLiveFilms(candidates);
      setCurrent(pick);
      setScreen("result");
      setShowBackups(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Live movie search failed.";
      console.warn("Live TMDB search failed.", error);
      setSearchError(`${message} Your recommendation was not replaced with a saved-catalog pick.`);
    } finally {
      setSearchingLive(false);
    }
  };

  const beginScreening = () => {
    setScreeningStep(0);
    setScreen("vibe");
  };

  const advanceScreening = () => {
    setScreeningStep((step) => Math.min(step + 1, screeningStepCount - 1));
  };

  const selectDiscoveryMode = (mode: DiscoveryMode) => {
    if (searchingLive) return;
    setDiscoveryMode(mode);
    void chooseMovie(excludedMovies, mode);
  };

  const goBackScreening = () => {
    if (screeningStep === 0) {
      setScreen("start");
      return;
    }
    setScreeningStep((step) => Math.max(step - 1, 0));
  };

  const backups = matches.filter((f) => f.title !== current?.title).slice(0, 2);
  const selectSeen = () => {
    if (!current) return;
    void chooseMovie([...excludedMovies, recommendationIdentity(current)]);
  };

  return (
    <main className="app-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationJsonLd).replace(/</g, "\\u003c") }} />
      {screen !== "vibe" && <header className="topbar">
        <span className="brand-name">shrugr</span>
      </header>}
      {searchError && <div className="toast live-search-error" role="alert">{searchError}</div>}

      {screen === "start" && <section className="welcome-page fade-in">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={13} /> THE ART OF PICKING NOTHING</div>
          <h1>Too many movies.<br /><span>One right now.</span></h1>
          <p className="hero-subtitle">Tell us your mood, your time, your vibe. We&apos;ll find the movie. You just press play.</p>
          <div className="start-actions"><button className="primary-button" onClick={beginScreening}>Find my movie <ArrowRight size={17} /></button></div>
          <div className="trust-line"><span><Clock3 size={14} /> UNDER 45 SECONDS</span><i /> <span><Moon size={14} /> NO ACCOUNT NEEDED</span></div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-glow" />
          <div className="film-card film-card-back"><div className="poster poster-purple"><span className="poster-caption">A WORLD<br />WITHIN WORLDS</span></div></div>
          <div className="film-card film-card-front"><div className="poster poster-pink"><span className="poster-stamp">TONIGHT&apos;S<br />LITTLE ESCAPE</span><span className="poster-title">THE<br />GRAND<br /><em>BUDAPEST</em><br />HOTEL</span><span className="poster-credit">A FILM BY WES ANDERSON</span></div></div>
          <div className="floating-note"><span className="note-spark">✳</span><div><b>your kind of night</b><small>just a little more you</small></div></div>
          <div className="art-caption">A GOOD FILM DOESN&apos;T NEED A COMMITTEE.</div>
        </div>
        <div className="bottom-note"><span className="tiny-spark">✳</span> GOOD PICKING IS OVERRATED. GOOD WATCHING ISN&apos;T.</div>
      </section>}

      {screen === "vibe" && <section className="screening-page fade-in">
        <button className="back-button screening-exit" onClick={goBackScreening}><ArrowLeft size={16} /> {screeningStep === 0 ? "Exit" : "Back"}</button>
        <div className="screening-progress">
          <div className="step-label">THE SCREENING <span>{String(screeningStep + 1).padStart(2, "0")} — {String(screeningStepCount).padStart(2, "0")}</span></div>
          <div className="screening-progress-track" role="progressbar" aria-label="Screening progress" aria-valuemin={1} aria-valuemax={screeningStepCount} aria-valuenow={screeningStep + 1}>
            <span style={{ width: `${((screeningStep + 1) / screeningStepCount) * 100}%` }} />
          </div>
        </div>
        <div className="screening-card" key={screeningStep} aria-live="polite">
          {screeningStep === 0 && <>
            <div className="eyebrow">FIRST, THE WINDOW</div>
            <h1>How much time<br /><em>have you got?</em></h1>
            <p>We&apos;ll find something that fits the night you have.</p>
            <ScreeningCarousel items={runtimes.map((item) => ({ ...item, icon: item.id === "short" ? "◷" : item.id === "medium" ? "◴" : item.id === "long" ? "◕" : "∞", art: `runtime-${item.id}` }))} selected={runtime} label="Runtime choices" onSelect={(value) => { setRuntime(value); advanceScreening(); }} />
          </>}
          {screeningStep === 1 && <>
            <div className="eyebrow">THE FEELING</div>
            <h1>What do you want<br /><em>to feel?</em></h1>
            <p>Go with the feeling you want to leave with.</p>
            <ScreeningCarousel items={[...moods.map(({ id, label, icon, sub }) => ({ id, label, hint: sub, icon, art: `mood-${id}` })), { id: null, label: "I’m open", hint: "Surprise me", icon: "✳", art: "mood-open" }]} selected={mood} label="Mood choices" onSelect={(value) => { setMood(value); advanceScreening(); }} />
          </>}
          {screeningStep === 2 && <>
            <div className="eyebrow">THE PACE</div>
            <h1>How should it<br /><em>unfold?</em></h1>
            <p>Choose the kind of attention you want to give it.</p>
            <ScreeningCarousel items={[...deliveries.map(({ id, label, icon }) => ({ id, label, icon, art: `pace-${id}` })), { id: null, label: "No preference", hint: "Let the film decide", icon: "✳", art: "pace-open" }]} selected={delivery} label="Pacing choices" onSelect={(value) => { setDelivery(value); advanceScreening(); }} />
          </>}
          {screeningStep === 3 && <>
            <div className="eyebrow">THE LOOK</div>
            <h1>Any visual mood<br /><em>calling to you?</em></h1>
            <p>Optional. Pick a look, or leave it to the film.</p>
            <ScreeningCarousel items={[...visuals.map(({ id, label, hint, swatch }) => ({ id, label, hint, swatch, icon: id === "energy" ? "✺" : id === "raw" ? "▧" : id === "composed" ? "▦" : "◌", art: `visual-${id}` })), { id: null, label: "No preference", hint: "Leave it to the film", icon: "✳", art: "visual-open" }]} selected={visual} label="Visual mood choices" onSelect={(value) => { setVisual(value); advanceScreening(); }} />
          </>}
          {screeningStep === 4 && <>
            <div className="eyebrow">REAL LIFE HAPPENS</div>
            <h1>Should it be easy<br /><em>to pause?</em></h1>
            <p>We&apos;ll favor films that are easier to step away from.</p>
            <ScreeningCarousel items={[{ id: true, label: "Yes, pause-friendly", hint: "I might need to step away", icon: "Ⅱ", art: "pause-yes" }, { id: false, label: "No preference", hint: "Keep the options open", icon: "▶", art: "pause-open" }]} selected={interruptions} label="Pause preference choices" onSelect={(value) => { setInterruptions(value); advanceScreening(); }} />
          </>}
          {screeningStep === 5 && <>
            <div className="eyebrow">THE FINAL CUT</div>
            <h1>What kind of picks<br /><em>should we screen?</em></h1>
            <p>Vibe fit comes first. Ratings only break ties in top-rated modes.</p>
            <ScreeningCarousel items={discoveryModes.map((item) => ({ ...item, icon: item.id === "balanced" ? "✳" : item.id === "trending" ? "↗" : item.id === "recent" ? "◷" : item.id === "popular" ? "◎" : "★", art: `discovery-${item.id}` }))} selected={discoveryMode} label="Discovery mode choices" onSelect={selectDiscoveryMode} disabled={searchingLive} />
            {searchingLive && <div className="movie-search-status" role="status" aria-live="polite">
              <LoaderCircle size={20} className="movie-search-spinner" aria-hidden="true" />
              <span><b>Pulling a movie for you…</b></span>
            </div>}
          </>}
        </div>
      </section>}

      {screen === "result" && current && <section className="result-page fade-in">
        <button className="back-button result-back" onClick={() => { setScreeningStep(screeningStepCount - 1); setScreen("vibe"); }}><ArrowLeft size={16} /> Change my answers</button>
        <div className="result-layout"><div className="result-poster-wrap"><div className="result-poster"><Image src={current.poster} alt={`${current.title} poster`} width={780} height={1170} onError={(e) => { e.currentTarget.style.display = "none"; }} /><div className={`poster-fallback ${current.palette}`}><span className="fallback-kicker">TONIGHT&apos;S PICK</span><strong>{current.title}</strong><small>{current.year} · A shrugr selection</small></div><span className="poster-tag"><Sparkles size={12} /> {current.isLive ? "LIVE PICK" : "YOUR MATCH"}</span></div><div className="poster-under"><span>{current.isLive ? "TONIGHT&apos;S PICK" : "CURATED FOR THIS MOMENT"}</span><span>✳</span></div></div>
          <div className="result-copy"><div className="eyebrow"><Sparkles size={13} /> {current.isLive ? "A SUGGESTION FOR TONIGHT" : "THIS ONE FEELS RIGHT"}</div><h1>{current.isLive ? current.title : <Link href={`/films/${current.slug}`}>{current.title}</Link>}</h1><div className="movie-meta"><span>{current.year}</span><i /> <span>{Math.floor(current.runtime / 60)}h {current.runtime % 60 ? `${current.runtime % 60}m` : ""}</span><i /> <span>{current.genres.join(" · ")}</span>{current.imdbRating != null && <><i /><span>IMDb {current.imdbRating.toFixed(1)}/10</span></>}</div>
            {!current.genericProfile && <div className="affirmation"><div className="affirmation-label"><span>✳</span> A LITTLE PERMISSION</div><p>“{affirmation(current, delivery ?? "simple", interruptions)}”</p></div>}
            <div className="fit-section"><h3>{current.genericProfile ? "ABOUT THIS SUGGESTION" : "WHY IT FITS RIGHT NOW"}</h3><ul><li><span>01</span>{current.genericProfile ? `Runtime: ${current.runtime} minutes.` : runtime !== "any" ? `Fits your ${runtime === "short" ? "under-90-minute" : runtime === "medium" ? "90–120 minute" : "open-ended"} window` : `${current.runtime} minutes, just right for tonight`}</li><li><span>02</span>{current.reason}</li>{interruptions && <li><span>03</span>{current.genericProfile || current.interruption == null ? "Pause-friendliness is unknown for this title." : "Easy to pause and find your place again"}</li>}</ul></div>
            {current.genericProfile && <p className="film-fit-note">Mood, delivery, and visual fit are only estimated from aggregated data, not editorially reviewed.</p>}
            <div className="result-actions"><button className="result-again" onClick={() => void chooseMovie()} disabled={searchingLive}><RotateCw size={16} /> {searchingLive ? "Finding another…" : "Give me another"}</button><button className="result-seen" onClick={selectSeen}><FilmIcon size={16} /> I&apos;ve seen this</button></div>
          </div></div>
        <div className="backup-section"><button className="backup-toggle" onClick={() => setShowBackups(!showBackups)} aria-expanded={showBackups}><span><span className="backup-number">02</span><span><b>Just in case</b><small>Two other good fits, no rabbit hole required.</small></span></span><ChevronDown size={17} className={showBackups ? "rotated" : ""} /></button>{showBackups && <div className="backup-list">{backups.length ? backups.map((film, index) => <button className="backup-item" key={film.title} onClick={() => { setCurrent(film); setShowBackups(false); }}><span className="backup-index">0{index + 1}</span><span className={`backup-thumb ${film.palette}`}><Image src={film.poster} alt={`${film.title} poster`} width={180} height={270} /></span><span className="backup-info"><b>{film.title}</b><small>{film.year} <i /> {Math.floor(film.runtime / 60)}h {film.runtime % 60}m <i /> {film.genres[0]}</small></span><ArrowRight size={16} /></button>) : <p className="no-backups">That&apos;s the last one for these filters. Try another vibe for more picks.</p>}</div>}</div>
        <button className="start-over" aria-label="Start over and choose a different movie" onClick={() => { setScreen("start"); setCurrent(null); }}>← &nbsp; Start over</button>
      </section>}
      {screen === "result" && !current && <section className="empty-result fade-in" aria-live="polite"><span className="empty-spark">✳</span><div className="eyebrow">NO MATCH THIS TIME</div><h1>That&apos;s a very specific kind of night.</h1><p>We couldn&apos;t find a film that fits those choices. Loosen one thing and we&apos;ll find your movie.</p><button className="primary-button" onClick={beginScreening}>Adjust my answers <ArrowRight size={16} /></button><button className="text-button" onClick={() => { setRuntime("any"); setInterruptions(false); setMood(null); setDelivery(null); setVisual(null); setDiscoveryMode("balanced"); beginScreening(); }}>Clear choices and try again</button></section>}
      {screen !== "vibe" && <footer className="site-footer"><span>© 2026 SHRUGR</span></footer>}
    </main>
  );
}
