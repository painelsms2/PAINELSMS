import React from 'react';

export const CountdownRing = ({ timeLeft, maxTime }) => {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / maxTime) * circumference;

  const isWarning = timeLeft < 60; // Less than 1 minute
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="countdown-ring-wrapper">
      <svg className="countdown-ring-svg" width="60" height="60" viewBox="0 0 60 60">
        <circle
          className="countdown-ring-bg"
          stroke="var(--border-color)"
          strokeWidth="4"
          fill="transparent"
          r={radius}
          cx="30"
          cy="30"
        />
        <circle
          className={`countdown-ring-progress ${isWarning ? 'warning' : ''}`}
          stroke={isWarning ? 'var(--danger-color)' : 'var(--primary-color)'}
          strokeWidth="4"
          fill="transparent"
          r={radius}
          cx="30"
          cy="30"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease',
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%'
          }}
        />
      </svg>
      <div className={`countdown-ring-text ${isWarning ? 'text-danger' : ''}`}>
        {formatTime(timeLeft)}
      </div>
    </div>
  );
};
