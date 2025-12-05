// Tiện ích chung cho tất cả game
const GameManager = {
  async loadHighScore(gameName) {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
      
      const response = await fetch(`/api/games/high-score/${gameName}`, { headers });
      if (response.ok) {
        const data = await response.json();
        return data.highScore || 0;
      }
    } catch (error) {
      console.log('Using local storage fallback for', gameName);
      return localStorage.getItem(`${gameName}_high_score`) || 0;
    }
    return 0;
  },

  async saveScore(gameName, score) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token, using local storage for', gameName);
        const currentHigh = localStorage.getItem(`${gameName}_high_score`) || 0;
        if (score > currentHigh) {
          localStorage.setItem(`${gameName}_high_score`, score);
        }
        return { highScore: Math.max(score, currentHigh) };
      }

      const response = await fetch('/api/games/save-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          gameName: gameName,
          score: score
        })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to save score for', gameName, ':', error);
      // Fallback
      const currentHigh = localStorage.getItem(`${gameName}_high_score`) || 0;
      if (score > currentHigh) {
        localStorage.setItem(`${gameName}_high_score`, score);
      }
      return { highScore: Math.max(score, currentHigh) };
    }
  },

  updateDisplay(elementId, score) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = score;
    }
  }
};