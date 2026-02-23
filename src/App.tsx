/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Target, Trophy, XCircle, Languages } from 'lucide-react';
import { 
  GameState, 
  Point, 
  Rocket, 
  PlayerMissile, 
  Explosion, 
  City, 
  Battery, 
  Language 
} from './types';
import { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  CITY_COUNT, 
  BATTERY_COUNT, 
  INITIAL_MISSILES, 
  WIN_SCORE, 
  SCORE_PER_KILL, 
  EXPLOSION_MAX_RADIUS, 
  EXPLOSION_GROWTH_RATE, 
  ROCKET_SPEED_MIN, 
  ROCKET_SPEED_MAX, 
  PLAYER_MISSILE_SPEED, 
  TRANSLATIONS 
} from './constants';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [lang, setLang] = useState<Language>('zh');
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  // Game state refs for the loop
  const stateRef = useRef({
    rockets: [] as Rocket[],
    playerMissiles: [] as PlayerMissile[],
    explosions: [] as Explosion[],
    lastRocketSpawn: 0,
    score: 0,
    batteries: [] as Battery[],
    cities: [] as City[],
    isGameOver: false,
    mousePos: { x: GAME_WIDTH / 2, y: 0 } as Point,
    startTime: 0,
  });

  const t = TRANSLATIONS[lang];

  const initGame = useCallback(() => {
    const newBatteries: Battery[] = [
      { id: 0, x: 50, y: GAME_HEIGHT - 40, missiles: INITIAL_MISSILES[0], maxMissiles: INITIAL_MISSILES[0], destroyed: false },
      { id: 1, x: GAME_WIDTH / 2, y: GAME_HEIGHT - 40, missiles: INITIAL_MISSILES[1], maxMissiles: INITIAL_MISSILES[1], destroyed: false },
      { id: 2, x: GAME_WIDTH - 50, y: GAME_HEIGHT - 40, missiles: INITIAL_MISSILES[2], maxMissiles: INITIAL_MISSILES[2], destroyed: false },
    ];

    const citySpacing = (GAME_WIDTH - 200) / (CITY_COUNT - 1);
    const newCities: City[] = Array.from({ length: CITY_COUNT }).map((_, i) => ({
      id: i,
      x: 100 + i * citySpacing,
      y: GAME_HEIGHT - 30,
      destroyed: false,
    }));

    setBatteries(newBatteries);
    setCities(newCities);
    setScore(0);
    setGameState(GameState.PLAYING);

    stateRef.current = {
      ...stateRef.current,
      rockets: [],
      playerMissiles: [],
      explosions: [],
      lastRocketSpawn: Date.now(),
      score: 0,
      batteries: newBatteries,
      cities: newCities,
      isGameOver: false,
      startTime: Date.now(),
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    stateRef.current.mousePos = {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== GameState.PLAYING) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const targetX = (clientX - rect.left) * scaleX;
    const targetY = (clientY - rect.top) * scaleY;

    stateRef.current.mousePos = { x: targetX, y: targetY };

    // Find nearest battery with missiles
    let bestBattery = -1;
    let minDist = Infinity;

    stateRef.current.batteries.forEach((b, i) => {
      if (!b.destroyed && b.missiles > 0) {
        const dist = Math.abs(b.x - targetX);
        if (dist < minDist) {
          minDist = dist;
          bestBattery = i;
        }
      }
    });

    if (bestBattery !== -1) {
      const battery = stateRef.current.batteries[bestBattery];
      battery.missiles -= 1;
      setBatteries([...stateRef.current.batteries]);

      const newMissile: PlayerMissile = {
        id: Math.random().toString(36).substr(2, 9),
        start: { x: battery.x, y: battery.y },
        target: { x: targetX, y: targetY },
        current: { x: battery.x, y: battery.y },
        speed: PLAYER_MISSILE_SPEED,
        batteryIndex: bestBattery,
        exploded: false,
      };

      stateRef.current.playerMissiles.push(newMissile);
    }
  };

  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const update = () => {
      const now = Date.now();

      // Spawn rockets
      const elapsedSeconds = (now - stateRef.current.startTime) / 1000;
      const spawnInterval = Math.max(300, 1500 - Math.min(stateRef.current.score, 800) - (elapsedSeconds * 5));

      if (now - stateRef.current.lastRocketSpawn > spawnInterval) {
        const spawnCount = 1 + Math.floor(elapsedSeconds / 20); // Increase spawn count every 20 seconds
        
        for (let i = 0; i < spawnCount; i++) {
          const startX = Math.random() * GAME_WIDTH;
          const targets = [...stateRef.current.cities, ...stateRef.current.batteries].filter(t => !t.destroyed);
          
          if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            const rocket: Rocket = {
              id: Math.random().toString(36).substr(2, 9),
              start: { x: startX, y: 0 },
              end: { x: target.x, y: target.y },
              current: { x: startX, y: 0 },
              speed: ROCKET_SPEED_MIN + Math.random() * (ROCKET_SPEED_MAX - ROCKET_SPEED_MIN),
              destroyed: false,
            };
            stateRef.current.rockets.push(rocket);
          }
        }
        stateRef.current.lastRocketSpawn = now;
      }

      // Update rockets
      stateRef.current.rockets.forEach(rocket => {
        const dx = rocket.end.x - rocket.start.x;
        const dy = rocket.end.y - rocket.start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const vx = (dx / dist) * rocket.speed;
        const vy = (dy / dist) * rocket.speed;

        rocket.current.x += vx;
        rocket.current.y += vy;

        // Check if reached target
        if (rocket.current.y >= rocket.end.y) {
          rocket.destroyed = true;
          // Create explosion at impact
          stateRef.current.explosions.push({
            id: Math.random().toString(36).substr(2, 9),
            x: rocket.current.x,
            y: rocket.current.y,
            radius: 0,
            maxRadius: EXPLOSION_MAX_RADIUS,
            growthRate: EXPLOSION_GROWTH_RATE,
            finished: false,
          });

          // Damage cities/batteries
          stateRef.current.cities.forEach(c => {
            if (!c.destroyed && Math.abs(c.x - rocket.current.x) < 20 && Math.abs(c.y - rocket.current.y) < 20) {
              c.destroyed = true;
              setCities([...stateRef.current.cities]);
            }
          });
          stateRef.current.batteries.forEach(b => {
            if (!b.destroyed && Math.abs(b.x - rocket.current.x) < 30 && Math.abs(b.y - rocket.current.y) < 30) {
              b.destroyed = true;
              setBatteries([...stateRef.current.batteries]);
            }
          });
        }
      });

      // Update player missiles
      stateRef.current.playerMissiles.forEach(missile => {
        const dx = missile.target.x - missile.start.x;
        const dy = missile.target.y - missile.start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const vx = (dx / dist) * missile.speed;
        const vy = (dy / dist) * missile.speed;

        missile.current.x += vx;
        missile.current.y += vy;

        // Check if reached target
        const distToTarget = Math.sqrt(
          Math.pow(missile.target.x - missile.current.x, 2) + 
          Math.pow(missile.target.y - missile.current.y, 2)
        );

        if (distToTarget < missile.speed) {
          missile.exploded = true;
          stateRef.current.explosions.push({
            id: Math.random().toString(36).substr(2, 9),
            x: missile.target.x,
            y: missile.target.y,
            radius: 0,
            maxRadius: EXPLOSION_MAX_RADIUS,
            growthRate: EXPLOSION_GROWTH_RATE,
            finished: false,
          });
        }
      });

      // Update explosions
      stateRef.current.explosions.forEach(exp => {
        exp.radius += exp.growthRate;
        if (exp.radius >= exp.maxRadius) {
          exp.finished = true;
        }

        // Check collision with rockets
        stateRef.current.rockets.forEach(rocket => {
          if (!rocket.destroyed) {
            const dist = Math.sqrt(Math.pow(rocket.current.x - exp.x, 2) + Math.pow(rocket.current.y - exp.y, 2));
            if (dist < exp.radius) {
              rocket.destroyed = true;
              stateRef.current.score += SCORE_PER_KILL;
              setScore(stateRef.current.score);
            }
          }
        });
      });

      // Cleanup
      stateRef.current.rockets = stateRef.current.rockets.filter(r => !r.destroyed);
      stateRef.current.playerMissiles = stateRef.current.playerMissiles.filter(m => !m.exploded);
      stateRef.current.explosions = stateRef.current.explosions.filter(e => !e.finished);

      // Check Win/Loss
      if (stateRef.current.score >= WIN_SCORE) {
        setGameState(GameState.WON);
      } else if (stateRef.current.batteries.every(b => b.destroyed)) {
        setGameState(GameState.LOST);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Draw background (Night sky)
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Draw stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 50; i++) {
        const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * GAME_WIDTH;
        const y = (Math.cos(i * 678.90) * 0.5 + 0.5) * GAME_HEIGHT;
        ctx.fillRect(x, y, 1, 1);
      }

      // Draw ground
      ctx.fillStyle = '#221100';
      ctx.fillRect(0, GAME_HEIGHT - 20, GAME_WIDTH, 20);

      // Draw cities
      stateRef.current.cities.forEach(city => {
        if (!city.destroyed) {
          ctx.fillStyle = '#4488ff';
          ctx.fillRect(city.x - 15, city.y - 15, 30, 15);
          ctx.fillStyle = '#3366cc';
          ctx.fillRect(city.x - 10, city.y - 25, 10, 10);
          ctx.fillRect(city.x + 5, city.y - 20, 8, 5);
        } else {
          ctx.fillStyle = '#333333';
          ctx.beginPath();
          ctx.arc(city.x, city.y, 10, 0, Math.PI, true);
          ctx.fill();
        }
      });

      // Draw batteries
      stateRef.current.batteries.forEach(b => {
        if (!b.destroyed) {
          // Base
          ctx.fillStyle = '#666666';
          ctx.beginPath();
          ctx.moveTo(b.x - 25, b.y);
          ctx.lineTo(b.x + 25, b.y);
          ctx.lineTo(b.x + 15, b.y - 20);
          ctx.lineTo(b.x - 15, b.y - 20);
          ctx.closePath();
          ctx.fill();
          
          // Turret rotation
          const mousePos = stateRef.current.mousePos || { x: GAME_WIDTH / 2, y: 0 };
          const angle = Math.atan2(mousePos.y - (b.y - 20), mousePos.x - b.x);
          
          ctx.save();
          ctx.translate(b.x, b.y - 20);
          ctx.rotate(angle);
          
          ctx.fillStyle = '#444444';
          ctx.fillRect(0, -5, 20, 10); // Barrel
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2); // Pivot
          ctx.fill();
          
          ctx.restore();
        } else {
          ctx.fillStyle = '#222222';
          ctx.beginPath();
          ctx.arc(b.x, b.y, 15, 0, Math.PI, true);
          ctx.fill();
        }
      });

      // Draw rockets
      stateRef.current.rockets.forEach(r => {
        // Rocket trail (thicker and more visible)
        ctx.strokeStyle = 'rgba(255, 68, 68, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(r.start.x, r.start.y);
        ctx.lineTo(r.current.x, r.current.y);
        ctx.stroke();

        // Rocket head glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff4444';
        
        // Rocket head (even larger)
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(r.current.x, r.current.y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(r.current.x, r.current.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Reset shadow for next draws
        ctx.shadowBlur = 0;
      });

      // Draw player missiles
      stateRef.current.playerMissiles.forEach(m => {
        // Missile trail
        ctx.strokeStyle = 'rgba(68, 255, 68, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(m.start.x, m.start.y);
        ctx.lineTo(m.current.x, m.current.y);
        ctx.stroke();

        // Missile head glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#44ff44';

        // Missile head
        ctx.fillStyle = '#44ff44';
        ctx.beginPath();
        ctx.arc(m.current.x, m.current.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Inner core for head
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(m.current.x, m.current.y, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Target marker
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(m.target.x - 5, m.target.y - 5);
        ctx.lineTo(m.target.x + 5, m.target.y + 5);
        ctx.moveTo(m.target.x + 5, m.target.y - 5);
        ctx.lineTo(m.target.x - 5, m.target.y + 5);
        ctx.stroke();
      });

      // Draw explosions
      stateRef.current.explosions.forEach(e => {
        const gradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, '#ffff00');
        gradient.addColorStop(0.6, '#ff8800');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const loop = () => {
      update();
      draw();
      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animationId);
  }, [gameState]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Header / HUD */}
      <div className="w-full max-w-4xl mb-4 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tighter text-emerald-500 uppercase italic">
            {t.title}
          </h1>
          <button 
            onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <Languages size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">{t.score}</span>
            <span className="text-2xl font-mono font-bold text-emerald-400">{score.toString().padStart(4, '0')}</span>
          </div>
        </div>
      </div>

      {/* Game Container */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-4xl aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="w-full h-full object-contain"
          onClick={handleCanvasClick}
          onTouchStart={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
        />

        {/* HUD Overlays removed */}

        {/* Modals */}
        <AnimatePresence>
          {gameState === GameState.START && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-center items-center justify-center p-8 text-center"
            >
              <div className="max-w-md">
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="mb-8"
                >
                  <Target className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-4xl font-bold mb-2 uppercase italic tracking-tighter">{t.title}</h2>
                  <p className="text-neutral-400 text-sm">{t.instructions}</p>
                </motion.div>
                <button
                  onClick={initGame}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                >
                  {t.start}
                </button>
              </div>
            </motion.div>
          )}

          {(gameState === GameState.WON || gameState === GameState.LOST) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-8 text-center"
            >
              <div className="max-w-md">
                <motion.div
                  initial={{ scale: 0.8, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="mb-8"
                >
                  {gameState === GameState.WON ? (
                    <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                  ) : (
                    <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                  )}
                  <h2 className={`text-4xl font-bold mb-2 uppercase italic tracking-tighter ${gameState === GameState.WON ? 'text-yellow-500' : 'text-red-500'}`}>
                    {gameState === GameState.WON ? t.win : t.loss}
                  </h2>
                  <p className="text-neutral-400 mb-4">
                    {gameState === GameState.WON ? t.victoryDesc : t.defeatDesc}
                  </p>
                  <div className="text-3xl font-mono font-bold text-white mb-8">
                    {t.score}: {score}
                  </div>
                </motion.div>
                <button
                  onClick={initGame}
                  className="px-8 py-3 bg-white text-black hover:bg-neutral-200 rounded-full font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                >
                  {t.playAgain}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="mt-8 flex gap-8 text-[10px] uppercase tracking-widest text-neutral-600 font-mono">
        <div className="flex items-center gap-2">
          <Shield size={12} />
          <span>Cities: {cities.filter(c => !c.destroyed).length} / {CITY_COUNT}</span>
        </div>
        <div className="flex items-center gap-2">
          <Target size={12} />
          <span>Target: {WIN_SCORE}</span>
        </div>
      </div>
    </div>
  );
}
