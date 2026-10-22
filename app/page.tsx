"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Film as FilmIcon,
  Moon,
  Play,
  RotateCw,
  Sparkles,
  X,
} from "lucide-react";
import { films, type Film } from "../lib/catalog";
import { buildRecommendationChoices, pickRecommendation, type RuntimeChoice } from "../lib/recommendation";

type Mood = "unwind" | "learn" | "hyped" | "feel" | "escape";
type Delivery = "hooked" | "soak" | "brain" | "simple";
type Visual = "energy" | "raw" | "composed" | "grounded";
const providerList = ["Netflix", "Max", "Prime Video", "Hulu", "Disney+", "Apple TV+", "MUBI", "Criterion"];
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

const affirmation = (film: Film, delivery: Delivery, interrupted: boolean) => {
  let note = film.note;
  if (delivery === "hooked" && film.runtime > 115) note = "Don't stress about catching every detail on the first pass. Ride the momentum and let the speed take over.";
  if (delivery === "soak") note = "Give this film a few minutes to find its rhythm. Let the silence and space do the heavy lifting.";
  if (delivery === "brain") note = "Stop trying to solve the plot ahead of time. Surrender to the dream logic and feel the mood.";
  if (interrupted && film.interruption >= 4) note += " The story has room to pause—step away whenever you need.";
  return note;
};

export default function Home() {
  const [screen, setScreen] = useState<"start" | "vibe" | "result">("start");
  const [providers, setProviders] = useState<string[]>(["Netflix", "Max", "Prime Video"]);
  const [runtime, setRuntime] = useState<RuntimeChoice>("any");
  const [interruptions, setInterruptions] = useState(false);
  const [mood, setMood] = useState<Mood | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [visual, setVisual] = useState<Visual | null>(null);
  const [current, setCurrent] = useState<Film | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [showBackups, setShowBackups] = useState(false);
  const [showVisuals, setShowVisuals] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("shrugr-providers");
      // This runs after hydration so localStorage can override the server-safe defaults.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setProviders(JSON.parse(stored) as string[]);
    } catch { /* keep defaults when storage is unavailable */ }
  }, []);

  const matches = useMemo(
    () =>
      buildRecommendationChoices({
        films,
        providers,
        runtime,
        interruptions,
        mood,
        delivery,
        visual,
        seen,
      }),
    [providers, runtime, interruptions, mood, delivery, visual, seen],
  );

  const chooseMovie = () => {
    const pick = pickRecommendation(matches, current);
    setCurrent(pick);
    setScreen("result");
    setShowBackups(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleProvider = (provider: string) => {
    const next = providers.includes(provider) ? providers.filter((p) => p !== provider) : [...providers, provider];
    setProviders(next);
    try { localStorage.setItem("shrugr-providers", JSON.stringify(next)); } catch { /* storage is optional */ }
  };

  const backups = matches.filter((f) => f.title !== current?.title).slice(0, 2);
  const selectSeen = () => {
    if (current) setSeen((prev) => [...prev, current.title]);
    chooseMovie();
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="wordmark" aria-label="Shrugr home" onClick={() => setScreen("start")}><span className="brand-mark">s<span>.</span></span><span className="brand-name">shrugr</span></button>
        <div className="topbar-right"><span className="status-dot" /> <span>YOUR MOVIE, FOUND</span><button aria-label="Reset to home" className="icon-button" onClick={() => setScreen("start")}><X size={16} /></button></div>
      </header>

      {screen === "start" && <section className="welcome-page fade-in">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={13} /> THE ART OF PICKING NOTHING</div>
          <h1>Too many movies.<br /><span>One right now.</span></h1>
          <p className="hero-subtitle">Tell us your mood, your time, your vibe. We&apos;ll find the movie. You just press play.</p>
          <div className="start-actions"><button className="primary-button" onClick={() => setScreen("vibe")}>Find my movie <ArrowRight size={17} /></button><button className="text-button" title="Group mode is coming soon" onClick={() => setShowToast(true)}>Watching with people? <span>Couch mode soon</span></button></div>
          <div className="trust-line"><span><Clock3 size={14} /> UNDER 45 SECONDS</span><i /> <span><Moon size={14} /> NO ACCOUNT NEEDED</span></div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-glow" />
          <div className="film-card film-card-back"><div className="poster poster-purple"><span className="poster-caption">A WORLD<br />WITHIN WORLDS</span></div></div>
          <div className="film-card film-card-front"><div className="poster poster-pink"><span className="poster-stamp">TONIGHT&apos;S<br />LITTLE ESCAPE</span><span className="poster-title">THE<br />GRAND<br /><em>BUDAPEST</em><br />HOTEL</span><span className="poster-credit">A FILM BY WES ANDERSON</span></div></div>
          <div className="floating-note"><span className="note-spark">✳</span><div><b>your kind of night</b><small>just a little more you</small></div></div>
          <div className="art-caption">A GOOD FILM DOESN&apos;T NEED A COMMITTEE.</div>
        </div>
        <div className="provider-preview"><div className="provider-label">PRIORITIZE THESE SERVICES IN OUR SAMPLE PICKS</div><div className="provider-grid">{providerList.map((provider, i) => <button key={provider} className={`provider-chip ${providers.includes(provider) ? "selected" : ""}`} onClick={() => toggleProvider(provider)} aria-pressed={providers.includes(provider)}><span className={`provider-glyph glyph-${i}`}>{["N", "M", "▶", "h", "✦", "●", "m", "C"][i]}</span>{provider}{providers.includes(provider) && <Check size={12} className="provider-check" />}</button>)}</div><p className="provider-footnote">Sample provider labels aren&apos;t live availability. Preferences stay on this device. <button onClick={() => setProviders([])}>Clear all</button></p></div>
        <div className="bottom-note"><span className="tiny-spark">✳</span> GOOD PICKING IS OVERRATED. GOOD WATCHING ISN&apos;T.</div>
        {showToast && <div className="toast" role="status">Couch mode is on the way. Solo movie night still counts.</div>}
      </section>}

      {screen === "vibe" && <section className="vibe-page fade-in">
        <div className="vibe-heading"><button className="back-button" onClick={() => setScreen("start")}><ArrowLeft size={16} /> Back</button><div className="step-label">A QUICK VIBE CHECK <span>01 — 03</span></div><h1>What feels right <em>right now?</em></h1><p>No overthinking. Go with your first instinct.</p></div>
        <div className="vibe-content">
          <section className="question-block"><div className="question-title"><span className="question-number">01</span><div><h2>How much time have you got?</h2><p>We&apos;ll keep it within your window.</p></div></div><div className="choice-row">{([{ id: "short", title: "Under 90 min", sub: "A quick one" }, { id: "medium", title: "90–120 min", sub: "The sweet spot" }, { id: "long", title: "120+ min", sub: "Room for a saga" }, { id: "any", title: "Any length", sub: "I&apos;m all in" }] as { id: RuntimeChoice; title: string; sub: string }[]).map((v) => <button key={v.id} className={`choice-card ${runtime === v.id ? "active" : ""}`} onClick={() => setRuntime(v.id)} aria-pressed={runtime === v.id}><span className="choice-check">{runtime === v.id && <Check size={12} />}</span><b>{v.title}</b><small>{v.sub.replace("&apos;", "'")}</small></button>)}</div>
            <button className={`interrupt-toggle ${interruptions ? "checked" : ""}`} onClick={() => setInterruptions(!interruptions)} aria-pressed={interruptions}><span className="toggle-box">{interruptions && <Check size={12} />}</span><span><b>Life might happen</b><small>Prefer something easy to pause and pick back up</small></span><span className="toggle-aside">PAUSE-FRIENDLY</span></button>
          </section>
          <section className="question-block"><div className="question-title"><span className="question-number">02</span><div><h2>What do you want to feel?</h2><p>Pick the energy you&apos;re in the mood for.</p></div></div><div className="mood-grid">{moods.map((item) => <button key={item.id} className={`mood-card ${mood === item.id ? "active" : ""}`} onClick={() => setMood(mood === item.id ? null : item.id)} aria-pressed={mood === item.id}><span className="mood-icon">{item.icon}</span><b>{item.label}</b><small>{item.sub}</small></button>)}</div></section>
          <section className="question-block"><div className="question-title"><span className="question-number">03</span><div><h2>How should it unfold?</h2><p>Pick a way of watching, not a genre.</p></div></div><div className="delivery-row">{deliveries.map((item) => <button key={item.id} className={`delivery-card ${delivery === item.id ? "active" : ""}`} onClick={() => setDelivery(delivery === item.id ? null : item.id)} aria-pressed={delivery === item.id}><span>{item.icon}</span>{item.label}</button>)}</div></section>
          <section className="question-block visual-block"><button className="visual-heading" onClick={() => setShowVisuals(!showVisuals)} aria-expanded={showVisuals}><div className="question-title"><span className="question-number">04</span><div><h2>Got a visual mood?</h2><p>Optional. Go with the look that calls to you.</p></div></div><ChevronDown size={17} className={showVisuals ? "rotated" : ""} /></button>{showVisuals && <div className="visual-grid">{visuals.map((item) => <button key={item.id} className={`visual-card ${item.swatch} ${visual === item.id ? "active" : ""}`} onClick={() => setVisual(visual === item.id ? null : item.id)} aria-pressed={visual === item.id}><span className="visual-select">{visual === item.id && <Check size={12} />}</span><b>{item.label}</b><small>{item.hint}</small></button>)}</div>}</section>
          <div className="recommend-footer"><div><span className="footer-spark">✳</span> Your answers, your kind of movie.</div><button className="primary-button" onClick={chooseMovie}>Find my movie <ArrowRight size={17} /></button></div>
        </div>
      </section>}

      {screen === "result" && current && <section className="result-page fade-in">
        <button className="back-button result-back" onClick={() => setScreen("vibe")}><ArrowLeft size={16} /> Change my vibe</button>
        <div className="result-layout"><div className="result-poster-wrap"><div className="result-poster"><Image src={current.poster} alt={`${current.title} poster`} width={780} height={1170} onError={(e) => { e.currentTarget.style.display = "none"; }} /><div className={`poster-fallback ${current.palette}`}><span className="fallback-kicker">TONIGHT&apos;S PICK</span><strong>{current.title}</strong><small>{current.year} · A shrugr selection</small></div><span className="poster-tag"><Sparkles size={12} /> YOUR MATCH</span></div><div className="poster-under"><span>CURATED FOR THIS MOMENT</span><span>✳</span></div></div>
          <div className="result-copy"><div className="eyebrow"><Sparkles size={13} /> THIS ONE FEELS RIGHT</div><h1><Link href={`/films/${current.slug}`}>{current.title}</Link></h1><div className="movie-meta"><span>{current.year}</span><i /> <span>{Math.floor(current.runtime / 60)}h {current.runtime % 60 ? `${current.runtime % 60}m` : ""}</span><i /> <span>{current.genres.join(" · ")}</span></div>
            <div className="affirmation"><div className="affirmation-label"><span>✳</span> A LITTLE PERMISSION</div><p>“{affirmation(current, delivery ?? "simple", interruptions)}”</p></div>
            <div className="fit-section"><h3>WHY IT FITS RIGHT NOW</h3><ul><li><span>01</span>{runtime !== "any" ? `Fits your ${runtime === "short" ? "under-90-minute" : runtime === "medium" ? "90–120 minute" : "open-ended"} window` : `${current.runtime} minutes, just right for tonight`}</li><li><span>02</span>{current.reason}</li>{interruptions && <li><span>03</span>Easy to pause and find your place again</li>}<li><span>{interruptions ? "04" : "03"}</span>Sample catalog provider labels: {current.providers.filter((p) => providers.length === 0 || providers.includes(p)).slice(0, 2).join(" and ") || "not matched to your selected services"} (not verified)</li></ul></div>
            <div className="watch-row"><div className="watch-label"><span className="live-dot" /> SAMPLE LABELS <b>{current.providers.filter((p) => providers.length === 0 || providers.includes(p)).slice(0, 2).join(" · ") || "NO PROVIDER MATCH"}</b></div><button className="primary-button watch-button" onClick={() => setShowToast(true)}><Play size={15} fill="currentColor" /> Availability info <ArrowRight size={15} /></button></div>
            <div className="result-actions"><button onClick={chooseMovie}><RotateCw size={14} /> Give me another</button><button onClick={selectSeen}><FilmIcon size={14} /> I&apos;ve seen this</button></div>
          </div></div>
        <div className="backup-section"><button className="backup-toggle" onClick={() => setShowBackups(!showBackups)} aria-expanded={showBackups}><span><span className="backup-number">02</span><span><b>Just in case</b><small>Two other good fits, no rabbit hole required.</small></span></span><ChevronDown size={17} className={showBackups ? "rotated" : ""} /></button>{showBackups && <div className="backup-list">{backups.length ? backups.map((film, index) => <button className="backup-item" key={film.title} onClick={() => { setCurrent(film); setShowBackups(false); }}><span className="backup-index">0{index + 1}</span><span className={`backup-thumb ${film.palette}`}><Image src={film.poster} alt={`${film.title} poster`} width={180} height={270} /></span><span className="backup-info"><b>{film.title}</b><small>{film.year} <i /> {Math.floor(film.runtime / 60)}h {film.runtime % 60}m <i /> {film.genres[0]}</small></span><ArrowRight size={16} /></button>) : <p className="no-backups">That&apos;s the last one for these filters. Try another vibe for more picks.</p>}</div>}</div>
        <button className="start-over" aria-label="Start over and choose a different movie" onClick={() => { setScreen("start"); setCurrent(null); }}>← &nbsp; Start over</button>
      </section>}
      {screen === "result" && !current && <section className="empty-result fade-in" aria-live="polite"><span className="empty-spark">✳</span><div className="eyebrow">NO MATCH THIS TIME</div><h1>That&apos;s a very specific kind of night.</h1><p>We couldn&apos;t find a film that fits every filter and service. Loosen one thing and we&apos;ll find your movie.</p><button className="primary-button" onClick={() => setScreen("vibe")}>Adjust my vibe <ArrowRight size={16} /></button><button className="text-button" onClick={() => { setProviders([]); setRuntime("any"); setInterruptions(false); setMood(null); setDelivery(null); setVisual(null); setScreen("vibe"); }}>Clear filters and try again</button></section>}
      <footer className="site-footer"><span>© 2025 SHRUGR</span><span>MADE FOR THE MOMENT, NOT THE ALGORITHM <span className="footer-dot">✳</span></span><span><Link href="/collections">CURATED PICKS</Link></span><span><a href="https://shrugr.ro.to">SHRUGR.RO.TO</a></span></footer>
      {showToast && screen === "result" && <div className="toast" role="status"><Check size={15} /> Provider labels are examples from the sample catalog. Shrugr does not verify streaming availability yet.</div>}
    </main>
  );
}
