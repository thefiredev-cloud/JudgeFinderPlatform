import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
export const alt = 'JudgeFinder.io - California Judicial Analytics Platform'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <svg
          width="100"
          height="100"
          viewBox="0 0 24 24"
          fill="none"
          style={{ marginBottom: '20px' }}
        >
          <path
            d="M12 2L2 7V12C2 16.5 4.23 20.68 7.62 23.15L12 24L16.38 23.15C19.77 20.68 22 16.5 22 12V7L12 2Z"
            fill="white"
            fillOpacity="0.2"
          />
          <path
            d="M12 2L2 7V12C2 16.5 4.23 20.68 7.62 23.15L12 24L16.38 23.15C19.77 20.68 22 16.5 22 12V7L12 2Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 12L11 14L15 10"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div
          style={{
            fontSize: 64,
            fontWeight: 'bold',
            marginBottom: '10px',
            textAlign: 'center',
          }}
        >
          JudgeFinder.io
        </div>
        <div
          style={{
            fontSize: 28,
            opacity: 0.95,
            textAlign: 'center',
            maxWidth: '80%',
            marginBottom: '20px',
          }}
        >
          California's Most Comprehensive Judicial Analytics Platform
        </div>
        <div
          style={{
            display: 'flex',
            gap: '40px',
            marginTop: '20px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 'bold' }}>Statewide</div>
            <div style={{ fontSize: 18, opacity: 0.8 }}>Judge Coverage</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 'bold' }}>Comprehensive</div>
            <div style={{ fontSize: 18, opacity: 0.8 }}>Case Library</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 'bold' }}>AI</div>
            <div style={{ fontSize: 18, opacity: 0.8 }}>Analytics</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
