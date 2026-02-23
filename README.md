# Inkling Nova Defense (Inkling新星防御)

一个基于经典《导弹指令》(Missile Command) 玩法的现代塔防网页游戏。

## 游戏特点
- **动态难度**：敌方火箭的生成频率和数量随时间增加。
- **交互体验**：炮台实时跟随鼠标/触摸点转向。
- **视觉强化**：发光特效、醒目的弹道轨迹及爆炸效果。
- **双语支持**：支持中英文切换。

## 技术栈
- **框架**: React 19
- **动画**: Motion (原 Framer Motion)
- **图标**: Lucide React
- **样式**: Tailwind CSS 4
- **构建**: Vite 6

## 本地开发

1. 安装依赖:
   ```bash
   npm install
   ```

2. 启动开发服务器:
   ```bash
   npm run dev
   ```

3. 构建生产版本:
   ```bash
   npm run build
   ```

## 部署到 Vercel

本项目已针对 Vercel 进行优化，您可以直接通过以下步骤部署：

1. 将代码上传到您的 GitHub 仓库。
2. 登录 [Vercel 控制台](https://vercel.com/)。
3. 点击 **"Add New"** -> **"Project"**。
4. 导入您的 GitHub 仓库。
5. Vercel 会自动识别 Vite 项目，点击 **"Deploy"** 即可。

---
*注：本项目目前为纯前端实现，无需配置环境变量即可运行。*
