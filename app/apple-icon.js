import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="180" height="180" viewBox="0 0 512 512" fill="none">
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
      </div>
    ),
    { ...size }
  );
}
