import { Inter, Instrument_Sans } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: 'variable',
});


export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata = {
  metadataBase: new URL("https://lock-in.me"),
  title: "LockIn - Student Accountability App",
  description: "The app that makes sure tomorrow actually comes — for you and your group. Stop procrastinating, start achieving.",
  keywords: ["productivity", "student", "accountability", "group projects", "study", "focus"],
  authors: [{ name: "LockIn" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LockIn",
  },
  openGraph: {
    title: "LockIn - Student Accountability App",
    description: "The app that makes sure tomorrow actually comes — for you and your group.",
    type: "website",
  },
};

const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('lockin-theme') || 'system';
      var resolved = theme;
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolved);

      // Five-ink cascade (editorial redesign) — read lockin-ink from localStorage
      // and expose it as [data-ink="..."] on <html> before first paint.
      // Separate from the accent-palette script below; runs in parallel during
      // the 7-accents-to-5-inks transition. See globals.css :234 for scope rules.
      var validInks = ['highlighter', 'redpen', 'carbon', 'moss', 'indigo-legacy'];
      var inkKey = localStorage.getItem('lockin-ink');
      if (!inkKey || validInks.indexOf(inkKey) === -1) inkKey = 'highlighter';
      document.documentElement.setAttribute('data-ink', inkKey);

      var accentId = localStorage.getItem('lockin-accent');
      if (accentId && accentId !== 'indigo') {
        var palettes = {
          ocean:   { p: '#3B82F6', s: '#06B6D4', t: '#22D3EE', h: '#2563EB' },
          emerald: { p: '#10B981', s: '#34D399', t: '#6EE7B7', h: '#059669' },
          sunset:  { p: '#F97316', s: '#F59E0B', t: '#FBBF24', h: '#EA580C' },
          rose:    { p: '#F43F5E', s: '#EC4899', t: '#F472B6', h: '#E11D48' },
          violet:  { p: '#8B5CF6', s: '#A855F7', t: '#D946EF', h: '#7C3AED' },
          slate:   { p: '#64748B', s: '#94A3B8', t: '#CBD5E1', h: '#475569' }
        };
        var pal = palettes[accentId];
        if (pal) {
          var hex = function(h) {
            var r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16);
            return { r: r, g: g, b: b };
          };
          var pr = hex(pal.p), tr = hex(pal.t);
          var isDark = resolved === 'dark';
          var sa = isDark ? 0.12 : 0.08;
          var ga = isDark ? 0.25 : 0.2;
          var fa = isDark ? 0.6 : 0.5;
          var gla = isDark ? 0.2 : 0.15;
          var glla = isDark ? 0.3 : 0.2;
          var el = document.documentElement.style;
          el.setProperty('--accent-primary', pal.p);
          el.setProperty('--accent-secondary', pal.s);
          el.setProperty('--accent-tertiary', pal.t);
          el.setProperty('--accent-primary-hover', pal.h);
          el.setProperty('--accent-text', pal.p);
          el.setProperty('--accent-glow', 'rgba('+pr.r+','+pr.g+','+pr.b+','+(isDark?0.2:0.15)+')');
          el.setProperty('--accent-primary-rgb', pr.r+', '+pr.g+', '+pr.b);
          el.setProperty('--accent-tertiary-rgb', tr.r+', '+tr.g+', '+tr.b);
          el.setProperty('--gradient-primary', 'linear-gradient(135deg, '+pal.p+' 0%, '+pal.s+' 50%, '+pal.t+' 100%)');
          el.setProperty('--gradient-secondary', 'linear-gradient(135deg, '+pal.p+' 0%, '+pal.s+' 100%)');
          el.setProperty('--gradient-subtle', 'linear-gradient(135deg, rgba('+pr.r+','+pr.g+','+pr.b+','+sa+') 0%, rgba('+tr.r+','+tr.g+','+tr.b+','+sa+') 100%)');
          el.setProperty('--gradient-glow', 'linear-gradient(135deg, rgba('+pr.r+','+pr.g+','+pr.b+','+ga+') 0%, rgba('+tr.r+','+tr.g+','+tr.b+','+ga+') 100%)');
          el.setProperty('--border-focus', 'rgba('+pr.r+','+pr.g+','+pr.b+','+fa+')');
          el.setProperty('--shadow-glow', '0 0 40px rgba('+pr.r+','+pr.g+','+pr.b+','+gla+')');
          el.setProperty('--shadow-glow-lg', '0 0 60px rgba('+pr.r+','+pr.g+','+pr.b+','+glla+')');
        }
      }
    } catch (e) { console.warn('Theme init failed:', e); }
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Editorial redesign fonts — Host Grotesk body + JetBrains Mono.
            Display serif is system (ui-serif → New York on macOS, Charter/Cambria elsewhere,
            Georgia as universal fallback) — matches lockin-test's rendered look exactly on macOS.
            Besley was considered but rendered too chunky/slab vs the lockin-test elegance. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Host+Grotesk:ital,wght@0,300..800;1,300..800&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} ${instrumentSans.variable}`}>
        {/* Global SVG filter defs — referenced by inline SVG underlines / highlighter strokes */}
        <svg
          aria-hidden
          focusable="false"
          width="0"
          height="0"
          style={{ position: 'absolute', width: 0, height: 0 }}
        >
          <defs>
            <filter id="marker-roughen" x="-5%" y="-30%" width="110%" height="160%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="1.6"
                numOctaves="2"
                seed="7"
                result="noise"
              />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" />
            </filter>
          </defs>
        </svg>
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
