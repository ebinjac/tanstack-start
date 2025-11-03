"use client";

import React from 'react';

interface EnsembleLogoProps {
  className?: string;
}

const EnsembleLogo = ({ className = "" }: EnsembleLogoProps) => {
  // American Express blue shades
  const blueGradient = {
    gradient1: "#006FCF",  // Primary blue
    gradient2: "#0057B8",  // Darker blue
    gradient3: "#003D7E"   // Deep navy
  };

  return (
    <div className={`aspect-square ${className}`}>
      <svg
        className="w-full h-full"
        viewBox="0 0 492.481 492.481"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="blueGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={blueGradient.gradient1} />
            <stop offset="100%" stopColor={blueGradient.gradient2} />
          </linearGradient>
          <linearGradient id="blueGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={blueGradient.gradient2} />
            <stop offset="100%" stopColor={blueGradient.gradient3} />
          </linearGradient>
          <linearGradient id="blueGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={blueGradient.gradient1} />
            <stop offset="100%" stopColor={blueGradient.gradient3} />
          </linearGradient>
        </defs>

        <g>
          <polygon 
            fill="url(#blueGradient1)" 
            points="25.687,297.141 135.735,0 271.455,0 161.398,297.141"
          />
        </g>

        <g>
          <polygon 
            fill="url(#blueGradient2)" 
            points="123.337,394.807 233.409,97.674 369.144,97.674 259.072,394.807"
          />
        </g>

        <g>
          <polygon 
            fill="url(#blueGradient3)" 
            points="221.026,492.481 331.083,195.348 466.794,195.348 356.746,492.481"
          />
        </g>
      </svg>
    </div>
  );
};

export default EnsembleLogo;