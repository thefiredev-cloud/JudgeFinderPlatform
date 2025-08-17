import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

const JudgeFinderNavLogo = () => {
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Subtle 3D tilt effect
  const rotateX = useSpring(useTransform(mouseY, [-10, 10], [5, -5]), { stiffness: 400, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-10, 10], [-5, 5]), { stiffness: 400, damping: 30 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set((e.clientX - centerX) / 5);
    mouseY.set((e.clientY - centerY) / 5);
  };

  return (
    <div className="flex items-center h-16 px-6 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/50">
      <motion.div
        className="flex items-center gap-2.5 cursor-pointer select-none"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          mouseX.set(0);
          mouseY.set(0);
        }}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Logo Icon Container */}
        <motion.div 
          className="relative"
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
        >
          {/* Glow effect behind icon */}
          <motion.div
            className="absolute inset-0 blur-xl"
            animate={{
              opacity: isHovered ? 1 : 0.6,
              scale: isHovered ? 1.3 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-400 to-purple-400 rounded-lg" />
          </motion.div>

          {/* Glass container for icon */}
          <div className="relative w-10 h-10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700/50 shadow-lg overflow-hidden">
            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 opacity-70"
              animate={{
                background: [
                  "linear-gradient(45deg, #60A5FA 0%, #A78BFA 100%)",
                  "linear-gradient(45deg, #A78BFA 0%, #60A5FA 100%)",
                  "linear-gradient(45deg, #60A5FA 0%, #A78BFA 100%)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            {/* Scales of Justice SVG - Compact Version */}
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              className="absolute inset-0 p-2"
            >
              <defs>
                <linearGradient id="navGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <motion.stop
                    offset="0%"
                    animate={{
                      stopColor: isHovered ? "#93BBFC" : "#FFFFFF",
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.stop
                    offset="100%"
                    animate={{
                      stopColor: isHovered ? "#C4B5FD" : "#F3E8FF",
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </linearGradient>
                
                <filter id="navGlow">
                  <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Simplified scales icon */}
              <g filter="url(#navGlow)">
                {/* Center pillar */}
                <motion.rect
                  x="19"
                  y="10"
                  width="2"
                  height="20"
                  fill="url(#navGradient)"
                  animate={{
                    height: isHovered ? 21 : 20,
                  }}
                />
                
                {/* Top triangle */}
                <motion.path
                  d="M 20 10 L 17 7 L 23 7 Z"
                  fill="url(#navGradient)"
                  animate={{
                    d: isHovered ? "M 20 9 L 16 6 L 24 6 Z" : "M 20 10 L 17 7 L 23 7 Z",
                  }}
                />
                
                {/* Balance beam */}
                <motion.rect
                  x="10"
                  y="13"
                  width="20"
                  height="1"
                  fill="url(#navGradient)"
                  animate={{
                    rotate: isHovered ? [0, -3, 3, -1.5, 1.5, 0] : 0,
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: isHovered ? Infinity : 0,
                  }}
                  style={{ transformOrigin: "20px 13.5px" }}
                />
                
                {/* Left pan */}
                <motion.g
                  animate={{
                    y: isHovered ? [0, 1, -1, 0.5, -0.5, 0] : 0,
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: isHovered ? Infinity : 0,
                    delay: 0.1
                  }}
                >
                  <line x1="13" y1="13" x2="13" y2="18" stroke="url(#navGradient)" strokeWidth="1" />
                  <path d="M 11 18 Q 13 20 15 18" fill="none" stroke="url(#navGradient)" strokeWidth="1.5" />
                </motion.g>
                
                {/* Right pan */}
                <motion.g
                  animate={{
                    y: isHovered ? [0, -1, 1, -0.5, 0.5, 0] : 0,
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: isHovered ? Infinity : 0,
                    delay: 0.1
                  }}
                >
                  <line x1="27" y1="13" x2="27" y2="18" stroke="url(#navGradient)" strokeWidth="1" />
                  <path d="M 25 18 Q 27 20 29 18" fill="none" stroke="url(#navGradient)" strokeWidth="1.5" />
                </motion.g>
                
                {/* Base */}
                <rect x="16" y="30" width="8" height="2" rx="1" fill="url(#navGradient)" />
              </g>
            </svg>

            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent"
              animate={{
                x: isHovered ? ["-100%", "100%"] : "-100%",
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut",
              }}
              style={{
                transform: "skewX(-20deg)",
              }}
            />
          </div>
        </motion.div>

        {/* Text Logo */}
        <motion.div 
          className="flex flex-col justify-center"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
        >
          <motion.div className="flex items-baseline gap-0.5">
            <motion.span 
              className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
              animate={{
                backgroundPosition: isHovered ? ["0% 50%", "100% 50%", "0% 50%"] : "0% 50%",
              }}
              transition={{
                duration: 2,
                repeat: isHovered ? Infinity : 0,
                ease: "linear"
              }}
              style={{
                backgroundSize: "200% 200%",
              }}
            >
              JudgeFinder
            </motion.span>
            <motion.span 
              className="text-lg font-light text-slate-400"
              animate={{
                color: isHovered ? "#94a3b8" : "#64748b",
              }}
            >
              .io
            </motion.span>
          </motion.div>
          
          {/* Subtle tagline that appears on hover */}
          <motion.div
            className="overflow-hidden h-0"
            animate={{
              height: isHovered ? "auto" : 0,
            }}
            transition={{ duration: 0.2 }}
          >
            <motion.p 
              className="text-[10px] text-slate-500 font-medium tracking-wider uppercase"
              initial={{ y: -10, opacity: 0 }}
              animate={{
                y: isHovered ? 0 : -10,
                opacity: isHovered ? 1 : 0,
              }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              Legal Analytics
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Floating indicator dot */}
        <motion.div
          className="ml-1"
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />
        </motion.div>
      </motion.div>

      {/* Demo navbar items to show context */}
      <div className="ml-auto flex items-center gap-6">
        <button className="text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors">
          Browse
        </button>
        <button className="text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors">
          About
        </button>
        <button className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all">
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default JudgeFinderNavLogo;