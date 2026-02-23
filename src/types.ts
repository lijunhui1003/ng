export enum GameState {
  START,
  PLAYING,
  WON,
  LOST
}

export interface Point {
  x: number;
  y: number;
}

export interface Rocket {
  id: string;
  start: Point;
  end: Point;
  current: Point;
  speed: number;
  destroyed: boolean;
}

export interface PlayerMissile {
  id: string;
  start: Point;
  target: Point;
  current: Point;
  speed: number;
  batteryIndex: number;
  exploded: boolean;
}

export interface Explosion {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  growthRate: number;
  finished: boolean;
}

export interface City {
  id: number;
  x: number;
  y: number;
  destroyed: boolean;
}

export interface Battery {
  id: number;
  x: number;
  y: number;
  missiles: number;
  maxMissiles: number;
  destroyed: boolean;
}

export type Language = 'en' | 'zh';
