import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const AnimatedBackground = React.memo(function AnimatedBackground() {
  const { theme } = useTheme();
  
  // Only render prominent background in light mode
  if (theme === 'dark') return null;

  const [isVisible, setIsVisible] = React.useState(!document.hidden);

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: -10,
      pointerEvents: 'none',
      overflow: 'hidden'
    }}>
      <svg
        style={{ width: '100%', height: '100%', color: 'var(--primary-color)' }}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Atmospheric SMS Background</title>
        
        <defs>
          <g id="spark">
            <circle cx="0" cy="0" r="2" fill="currentColor" />
          </g>
          
          <g id="bubble">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(-12, -12)"/>
          </g>
          
          <g id="envelope">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(-12, -12)"/>
            <polyline points="22,6 12,13 2,6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(-12, -12)"/>
          </g>
          
          <g id="signal">
            <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(-12, -12)"/>
          </g>

          <g id="drop">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(-12, -12)"/>
          </g>
        </defs>

        <g className="anim-layer-1" style={{ animationPlayState: isVisible ? 'running' : 'paused' }}>
          {/* Sparks Group 1 */}
          <use href="#spark" x="150" y="250" opacity="0.05" transform="scale(1.5) translate(-50, -83)" />
          <use href="#spark" x="800" y="150" opacity="0.07" transform="scale(2) translate(-400, -75)" />
          <use href="#spark" x="400" y="850" opacity="0.04" transform="scale(1.2) translate(-333, -708)" />
          <use href="#spark" x="850" y="700" opacity="0.06" transform="scale(1.8) translate(-472, -388)" />
          
          {/* Glyphs Group 1 */}
          <use href="#bubble" x="250" y="350" opacity="0.04" transform="scale(1.5) translate(-83, -116)" />
          <use href="#envelope" x="750" y="800" opacity="0.03" transform="scale(1.3) translate(-250, -266) rotate(10)" />
        </g>

        <g className="anim-layer-2" style={{ animationPlayState: isVisible ? 'running' : 'paused' }}>
          {/* Sparks Group 2 */}
          <use href="#spark" x="350" y="100" opacity="0.05" transform="scale(1.2) translate(-291, -83)" />
          <use href="#spark" x="900" y="450" opacity="0.04" transform="scale(1.5) translate(-600, -300)" />
          <use href="#spark" x="100" y="750" opacity="0.06" transform="scale(2.2) translate(-45, -340)" />
          <use href="#spark" x="650" y="250" opacity="0.05" transform="scale(1) translate(0, 0)" />
          
          {/* Glyphs Group 2 */}
          <use href="#signal" x="850" y="300" opacity="0.05" transform="scale(1.4) translate(-303, -107) rotate(-15)" />
          <use href="#drop" x="300" y="800" opacity="0.04" transform="scale(1.6) translate(-187, -500) rotate(5)" />
        </g>

        <g className="anim-layer-3" style={{ animationPlayState: isVisible ? 'running' : 'paused' }}>
          {/* Sparks Group 3 */}
          <use href="#spark" x="550" y="550" opacity="0.03" transform="scale(1.8) translate(-305, -305)" />
          <use href="#spark" x="200" y="500" opacity="0.05" transform="scale(1) translate(0, 0)" />
          <use href="#spark" x="700" y="900" opacity="0.06" transform="scale(1.4) translate(-500, -642)" />
          
          {/* Glyphs Group 3 */}
          <use href="#bubble" x="500" y="150" opacity="0.03" transform="scale(1.2) translate(-416, -125) rotate(-5)" />
          <use href="#envelope" x="150" y="150" opacity="0.02" transform="scale(1.5) translate(-100, -100) rotate(15)" />
        </g>
      </svg>
      <style>{`
        .anim-layer-1 {
          animation: float1 18s ease-in-out infinite alternate;
          transform-origin: center;
        }
        .anim-layer-2 {
          animation: float2 22s ease-in-out infinite alternate;
          transform-origin: center;
        }
        .anim-layer-3 {
          animation: float3 25s ease-in-out infinite alternate;
          transform-origin: center;
        }
        
        @keyframes float1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-15px, 20px) scale(1.02); }
        }
        @keyframes float2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(20px, -15px) scale(0.98); }
        }
        @keyframes float3 {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(10px, 10px) rotate(2deg); }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .anim-layer-1, .anim-layer-2, .anim-layer-3 {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
});

export default AnimatedBackground;
