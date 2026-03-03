import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'LockIn - Student Accountability App';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16132b 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Lock icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <svg width="80" height="80" viewBox="0 0 512 512" fill="none">
            <rect width="512" height="512" rx="108" fill="url(#bg)" />
            <rect x="136" y="232" width="240" height="196" rx="32" fill="white" />
            <path
              d="M176 232V184C176 139.8 212.8 104 256 104C299.2 104 336 139.8 336 184V232"
              stroke="white"
              strokeWidth="36"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M208 330L244 366L304 296"
              stroke="#7C3AED"
              strokeWidth="32"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512">
                <stop stopColor="#6366F1" />
                <stop offset="0.5" stopColor="#8B5CF6" />
                <stop offset="1" stopColor="#D946EF" />
              </linearGradient>
            </defs>
          </svg>

          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              marginLeft: 20,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6, #D946EF)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            LockIn
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 32,
            color: '#a1a1aa',
            margin: 0,
            fontWeight: 500,
          }}
        >
          The app that makes sure tomorrow actually comes.
        </p>

        {/* Features row */}
        <div
          style={{
            display: 'flex',
            gap: 40,
            marginTop: 40,
          }}
        >
          {['Pacts', 'Groups', 'Focus Timer', 'Streaks'].map((feature) => (
            <div
              key={feature}
              style={{
                fontSize: 20,
                color: '#71717a',
                padding: '8px 20px',
                border: '1px solid #27272a',
                borderRadius: 20,
              }}
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
