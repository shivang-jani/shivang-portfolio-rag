"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Chat from "@/components/Chat";
import WorkVisual from "@/components/WorkVisual";

const WHATSAPP_URL =
  "https://wa.me/918770991417?text=" +
  encodeURIComponent("Hi Shivang — I came across your portfolio and wanted to connect.");

const METRICS = [
  { to: 50, fmt: (n: number) => `${Math.round(n)}K+`, label: "automated voice calls / month" },
  { to: 1, fmt: (n: number) => `<${Math.round(n)}s`, label: "end-to-end voice pipeline latency" },
  { to: 1000, fmt: (n: number) => `${Math.round(n).toLocaleString()}+`, label: "CV ingestions / day, agentic pipeline" },
  { to: 10, fmt: (n: number) => `${Math.round(n)}K+`, label: "API gateway requests / day" },
];

const BUILD = [
  {
    verb: "listen.",
    cls: "c-cyan",
    accent: "#2fe6ff",
    name: "Real-time voice AI",
    body: "Backends for AI that talks back in real time — STT/TTS streamed over WebSockets and HTTP to telephony providers, tuned to sub-second latency across 50K+ screening calls a month.",
  },
  {
    verb: "decide.",
    cls: "c-magenta",
    accent: "#ff3d8b",
    name: "Agentic AI pipelines",
    body: "Multi-step LangGraph workflows that match CVs to roles, score candidate relevancy, and orchestrate downstream assessments across 1,000+ ingestions a day.",
  },
  {
    verb: "scale.",
    cls: "c-amber",
    accent: "#ffc24b",
    name: "Event-driven backends",
    body: "Kafka services that consume, enrich, and publish across teams, and Spring Boot microservices behind an NGINX gateway — fault-tolerant, zero-downtime, observable at 10K+ requests a day.",
  },
];

const EXPERIENCE = [
  {
    when: "Jul 2025 — Present",
    role: "Backend AI Engineer",
    org: "Piramal Capital & Housing Finance · via StatusNeo",
    points: [
      "Architected an AI voice-screening platform (STT/TTS + real-time models over telephony) handling 50K+ outbound calls a month at sub-second latency.",
      "Built a Kafka-based Call Analysis Service consuming multiple topics and publishing enriched, LLM-generated insights for downstream teams.",
      "Designed LangGraph recruitment agents for CV/JD matching and persona-based candidate decisioning across 1,000+ ingestions a day.",
    ],
  },
  {
    when: "Jul 2024 — Jul 2025",
    role: "Software Development Intern",
    org: "Piramal Capital & Housing Finance",
    points: [
      "Shipped production Spring Boot microservices with clean architecture and test coverage, cutting backend error rates ~20%.",
      "Configured an NGINX API gateway for 10K+ daily requests with load balancing, HTTPS, low-latency routing, and automatic failover.",
      "Refactored legacy services into robust REST APIs with zero-downtime deployment pipelines.",
    ],
  },
  {
    when: "Jul 2020 — Aug 2025",
    role: "B.E. Electrical & Electronics · M.Sc. Chemistry",
    org: "BITS Pilani, Hyderabad Campus",
    points: ["Dual-degree program."],
  },
];

const WORK: {
  kind: "voice" | "agents" | "portal" | "social";
  accent: string;
  kicker: string;
  title: string;
  body: string;
  tags: string[];
  image?: string;
}[] = [
  {
    kind: "voice",
    accent: "#2fe6ff",
    kicker: "Production · Piramal",
    title: "AI Voice Calling Platform",
    body: "Places automated screening calls, streams synthesized speech to telephony providers in real time, and analyzes every conversation with LLMs — 50K+ calls a month at sub-second latency, with dashboards for call details, AI analyses, recordings, and agent prompts.",
    tags: ["Java", "Python", "Spring Boot", "Kafka", "AWS Bedrock", "WebSockets"],
  },
  {
    kind: "agents",
    accent: "#8b6cff",
    kicker: "Production · Piramal",
    title: "HR Hiring Platform",
    body: "LangGraph agents that automate CV–JD matching, score candidate relevancy, and evaluate responses against personas — orchestrating downstream assessments across 1,000+ ingestions a day.",
    tags: ["LangGraph", "Python", "LLMs", "Agents"],
  },
  {
    kind: "portal",
    accent: "#ffc24b",
    kicker: "Project",
    title: "BITS Job Portal",
    body: "A high-availability job portal built from scratch — REST APIs, authentication, a MongoDB backend, and GitHub Actions + Vercel CI/CD. Reached 100+ users in its first 3 days.",
    tags: ["Spring Boot", "React", "MongoDB", "Docker"],
  },
  {
    kind: "social",
    accent: "#ff3d8b",
    kicker: "Project",
    title: "Twitter Clone",
    body: "A scalable social API with layered OOP, JUnit unit and integration tests, exception handling, input validation, and in-memory H2 persistence via JDBC.",
    tags: ["Java", "Spring Boot", "JUnit", "H2"],
  },
];

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.registerPlugin(ScrollTrigger);

    let lenis: Lenis | undefined;
    let rafCb: ((t: number) => void) | undefined;

    if (!reduce) {
      lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      rafCb = (time: number) => lenis!.raf(time * 1000);
      gsap.ticker.add(rafCb);
      gsap.ticker.lagSmoothing(0);
    }

    const ctx = gsap.context((self) => {
      const q = self!.selector!;

      // Progress bar — works with or without reduced motion.
      const bar = q(".progress__bar")[0] as HTMLElement | undefined;
      if (bar) {
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: (st) => {
            bar.style.width = `${(st.progress * 100).toFixed(2)}%`;
          },
        });
      }

      // Count-up metrics (runs regardless; just no easing feel under reduced motion).
      q(".metric__val").forEach((el: Element, i: number) => {
        const m = METRICS[i];
        if (!m) return;
        const node = el as HTMLElement;
        const obj = { v: 0 };
        node.textContent = m.fmt(0);
        gsap.to(obj, {
          v: m.to,
          duration: reduce ? 0 : 1.6,
          ease: "power2.out",
          delay: reduce ? 0 : 0.3,
          onUpdate: () => {
            node.textContent = m.fmt(obj.v);
          },
        });
      });

      if (reduce) return; // everything below is motion; leave static layout.

      // Hero entrance.
      gsap.from(q(".hero__status, .hero__name, .hero__lead, .hero__sub, .hero__actions"), {
        y: 24,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.09,
      });
      gsap.from(q(".telemetry"), {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.2,
      });

      // Manifesto — pinned frame; verb + its capability swap together in place.
      const manifesto = q(".manifesto")[0] as HTMLElement | undefined;
      const manifestoPin = q(".manifesto__pin")[0] as HTMLElement | undefined;
      const slides = q(".mslide");
      const barFills = q(".mbar i");
      if (manifesto && manifestoPin && slides.length) {
        manifesto.classList.add("is-animated");
        gsap.set(slides, { autoAlpha: 0, yPercent: 8 });
        gsap.set(slides[0], { autoAlpha: 1, yPercent: 0 });
        if (barFills[0]) gsap.set(barFills[0], { scaleX: 1 });

        const HOLD = 1.2;
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: manifesto,
            start: "top top",
            end: "+=" + slides.length * 85 + "%",
            pin: manifestoPin,
            scrub: 0.5,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        for (let i = 1; i < slides.length; i++) {
          const at = i * HOLD;
          tl.to(slides[i - 1], { autoAlpha: 0, yPercent: -8, duration: 0.4 }, at)
            .fromTo(slides[i], { autoAlpha: 0, yPercent: 8 }, { autoAlpha: 1, yPercent: 0, duration: 0.4 }, at);
          if (barFills[i - 1]) tl.to(barFills[i - 1], { scaleX: 0, duration: 0.4 }, at);
          if (barFills[i]) tl.to(barFills[i], { scaleX: 1, duration: 0.4 }, at);
        }
      }

      // Scroll reveals.
      q(".reveal").forEach((el: Element) => {
        gsap.from(el, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });

      // Work — pin one stage and crossfade each project in place.
      const stage = q(".work-stage")[0] as HTMLElement | undefined;
      const stageInner = q(".work-stage__inner")[0] as HTMLElement | undefined;
      const panels = q(".panel");
      if (stage && stageInner && panels.length) {
        stage.classList.add("is-stage");
        gsap.set(panels, { autoAlpha: 0 });
        gsap.set(panels[0], { autoAlpha: 1 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: "+=" + panels.length * 100 + "%",
            pin: stageInner,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        const HOLD = 1.4; // timeline units between crossfades (dwell on each project)
        const media0 = panels[0].querySelector(".panel__media");
        if (media0) tl.fromTo(media0, { scale: 1.09 }, { scale: 1, ease: "none", duration: HOLD }, 0);

        for (let i = 1; i < panels.length; i++) {
          const prev = panels[i - 1];
          const cur = panels[i];
          const curMedia = cur.querySelector(".panel__media");
          const curInner = cur.querySelector(".panel__inner");
          const at = i * HOLD;
          tl.to(prev, { autoAlpha: 0, duration: 0.45 }, at)
            .fromTo(cur, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45 }, at);
          if (curInner)
            tl.fromTo(curInner, { yPercent: 8, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.55 }, at);
          if (curMedia)
            tl.fromTo(curMedia, { scale: 1.09 }, { scale: 1, ease: "none", duration: HOLD }, at);
        }
      }

      ScrollTrigger.refresh();
    }, root);

    // Smooth-scroll the in-page anchors via Lenis when available.
    const onNavClick = (e: Event) => {
      const a = (e.currentTarget as HTMLAnchorElement);
      const id = a.getAttribute("href");
      if (!id || !id.startsWith("#")) return;
      const target = root.current?.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target as HTMLElement, { offset: -62 });
      else (target as HTMLElement).scrollIntoView({ behavior: "smooth" });
    };
    const anchors = root.current?.querySelectorAll<HTMLAnchorElement>('a[href^="#"]') ?? [];
    anchors.forEach((a) => a.addEventListener("click", onNavClick));

    // Recompute once fonts settle.
    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts?.ready) document.fonts.ready.then(refresh);
    window.addEventListener("load", refresh);

    return () => {
      anchors.forEach((a) => a.removeEventListener("click", onNavClick));
      window.removeEventListener("load", refresh);
      ctx.revert();
      if (rafCb) gsap.ticker.remove(rafCb);
      lenis?.destroy();
    };
  }, []);

  return (
    <div ref={root} className="landing">
      <div className="progress" aria-hidden="true">
        <div className="progress__bar" />
      </div>

      <nav className="nav">
        <div className="wrap nav__inner">
          <span className="nav__mark mono">
            shivang<b>.</b>jani
          </span>
          <div className="nav__links">
            <a href="#build">What I build</a>
            <a href="#path">Experience</a>
            <a href="#work">Work</a>
          </div>
          <a className="nav__cta" href="#ask">
            ask the bot
          </a>
        </div>
      </nav>

      <header className="hero">
        <div className="hero__glow" aria-hidden="true" />
        <div className="wrap hero__grid">
          <div>
            <span className="hero__status">
              <span className="dot" aria-hidden="true" />
              Backend &amp; AI Engineer · available for new roles
            </span>
            <h1 className="hero__name">Shivang Jani</h1>
            <p className="hero__lead">
              I build backend systems that respond <span className="grad-text">in real time</span>.
            </p>
            <p className="hero__sub">
              Voice AI platforms, agentic LLM pipelines, and the event-driven
              services underneath them — in Java, Spring Boot, Python, and AWS.
              Currently at Piramal Capital &amp; Housing Finance.
            </p>
            <div className="hero__actions">
              <a className="btn btn--primary" href="#ask">
                Ask about my work
              </a>
              <a
                className="btn btn--whatsapp"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01C17.18 3.03 14.69 2 12.04 2z m0 18.15h-.01c-1.52 0-3.01-.41-4.3-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.23-8.24 8.23z" />
                </svg>
                WhatsApp
              </a>
            </div>
          </div>

          <aside className="telemetry" aria-label="Career metrics">
            <div className="telemetry__bar">
              <span>live metrics</span>
              <span className="telemetry__eq" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
              </span>
            </div>
            {METRICS.map((m) => (
              <div className="metric" key={m.label}>
                <span className="metric__val mono">{m.fmt(m.to)}</span>
                <span className="metric__label">{m.label}</span>
              </div>
            ))}
          </aside>
        </div>
      </header>

      <section className="manifesto" id="build">
        <div className="manifesto__pin">
          <div className="wrap">
            <span className="section__tag mono manifesto__eyebrow">what I build</span>
            <p className="manifesto__lead">I build backend systems that</p>
            <div className="manifesto__steps" aria-hidden="true">
              {BUILD.map((b) => (
                <span className="mbar" key={b.name} style={{ color: b.accent }}>
                  <i />
                </span>
              ))}
            </div>
            <div className="manifesto__stage">
              {BUILD.map((b) => (
                <div className="mslide" key={b.verb}>
                  <h2 className={`mslide__verb ${b.cls}`}>{b.verb}</h2>
                  <div className="mslide__detail">
                    <h3 className="mslide__name">{b.name}</h3>
                    <p className="mslide__body">{b.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="path">
        <div className="wrap">
          <div className="section__head reveal">
            <span className="section__tag mono">timeline</span>
            <h2 className="section__title">Experience</h2>
          </div>
          <div className="timeline">
            {EXPERIENCE.map((e) => (
              <div className="tl reveal" key={e.role}>
                <div className="tl__when mono">{e.when}</div>
                <h3 className="tl__role">{e.role}</h3>
                <div className="tl__org">{e.org}</div>
                <ul className="tl__list">
                  {e.points.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="work">
        <div className="wrap work-intro reveal">
          <span className="section__tag mono">selected work</span>
          <h2 className="section__title">Things I've shipped</h2>
        </div>
        <div className="work-stage">
          <div className="work-stage__inner">
            {WORK.map((w) => (
              <article
                className="panel"
                key={w.title}
                style={{ "--pa": w.accent } as CSSProperties}
              >
                <div className="panel__media">
                  <WorkVisual kind={w.kind} accent={w.accent} src={w.image} alt={`${w.title} visual`} />
                </div>
                <div className="panel__scrim" aria-hidden="true" />
                <div className="panel__content">
                  <div className="wrap">
                    <div className="panel__inner">
                      <div className="panel__kicker mono">{w.kicker}</div>
                      <h3 className="panel__title">{w.title}</h3>
                      <p className="panel__body">{w.body}</p>
                      <div className="tags">
                        {w.tags.map((t) => (
                          <span className="tag" key={t}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="ask">
        <div className="wrap">
          <div className="section__head reveal">
            <span className="section__tag mono">ask</span>
            <h2 className="section__title">Interrogate my résumé</h2>
          </div>
          <p className="ask__intro reveal">
            This assistant answers from my actual resume and profile — grounded,
            no guessing. Ask about a project, a technology, or whether I'd be a fit
            for your team.
          </p>
          <div className="reveal">
            <Chat />
          </div>
        </div>
      </section>
    </div>
  );
}
