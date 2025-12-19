# Flappy Bird Game 

---

## 🎮 How to Play
- **Goal**: Fly the bird through gaps between pipes without hitting them.
- **Controls**:
  - **Press `Space` or `Arrow Up`** → Bird jumps upward.
- **Scoring**:
  - Pass through pipes → **+1 point**
  - Collect diamonds → **+5 points**
- **Game Over**:
  - When you crash → **Game Over** → press **Enter** to restart
- **Leaderboard**: 
  -Top 5 (best score per player name), backed by API or local fallback

---

## 🧱 Tech Stack

- **Frontend:** HTML5, CSS, JavaScript (Canvas API)
- **Backend:** ASP.NET Core Web API (C#), EF Core, SQLite
- **Version Control:** Git

---

## ⚙️ How to Run

### Frontend (Dev)
1. Open `src/index.html` in your browser.
2. Controls: **Space/Arrow Up** to jump, **Enter** to start/restart, **Escape** to close modals.

---

### Backend (API)
1. Open a terminal in the **GameApi/** folder:
  ```bash
  cd GameApi
  dotnet restore

2. Create or update database:
  dotnet tool update -g dotnet-ef
  dotnet ef migrations add InitLean
  dotnet ef database update

3. Run the API:

  dotnet run

---