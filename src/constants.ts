export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const CITY_COUNT = 6;
export const BATTERY_COUNT = 3;

export const INITIAL_MISSILES = [100, 100, 100];
export const WIN_SCORE = 1000;
export const SCORE_PER_KILL = 20;

export const EXPLOSION_MAX_RADIUS = 40;
export const EXPLOSION_GROWTH_RATE = 1.5;

export const ROCKET_SPEED_MIN = 0.5;
export const ROCKET_SPEED_MAX = 1.5;

export const PLAYER_MISSILE_SPEED = 10;

export const TRANSLATIONS = {
  en: {
    title: "Inkling Nova Defense",
    score: "Score",
    missiles: "Missiles",
    win: "Mission Accomplished!",
    loss: "Defense Failed!",
    playAgain: "Play Again",
    start: "Start Game",
    instructions: "Click anywhere to intercept incoming rockets. Protect your cities!",
    victoryDesc: "You have successfully defended the star system.",
    defeatDesc: "All missile batteries have been destroyed.",
  },
  zh: {
    title: "inkling新星防御",
    score: "得分",
    missiles: "导弹",
    win: "任务成功！",
    loss: "防御失败！",
    playAgain: "再玩一次",
    start: "开始游戏",
    instructions: "点击屏幕任何位置发射拦截导弹。保护你的城市！",
    victoryDesc: "你成功保卫了星系。",
    defeatDesc: "所有导弹发射塔已被摧毁。",
  }
};
