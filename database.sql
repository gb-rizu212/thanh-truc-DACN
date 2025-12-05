-- Tạo database 
CREATE DATABASE IF NOT EXISTS petgame DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE petgame; 

-- Xóa bảng cũ nếu tồn tại (cẩn thận)
-- DROP TABLE IF EXISTS logs;
-- DROP TABLE IF EXISTS inventory;
-- DROP TABLE IF EXISTS pets;
-- DROP TABLE IF EXISTS items;
-- DROP TABLE IF EXISTS users;

-- bảng user
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- bảng pet
CREATE TABLE IF NOT EXISTS pets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(50) DEFAULT 'Pet',
  hunger INT DEFAULT 100,
  happiness INT DEFAULT 100,
  health INT DEFAULT 100,
  energy INT DEFAULT 100,
  gold INT DEFAULT 1000,  -- ĐỔI DEFAULT THÀNH 1000
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  last_decay DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_pet (user_id)  -- ĐẢM BẢO MỖI USER CHỈ CÓ 1 PET
);

-- bảng items (CHỈNH SỬA: thêm description)
CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('food','potion') DEFAULT 'food',
  hunger_change INT DEFAULT 0,
  happiness_change INT DEFAULT 0,
  health_change INT DEFAULT 0,
  energy_change INT DEFAULT 0,
  price INT DEFAULT 0,
  img VARCHAR(255) DEFAULT ''
);

-- bảng inventory
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- bảng log
CREATE TABLE IF NOT EXISTS logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100),
  detail TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  duration INT, -- in minutes
  xp_earned INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
   INDEX idx_user_created (user_id, created_at)
);
-- Thêm vào file SQL hiện có
CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255),
    content TEXT,
    type ENUM('journal', 'note') DEFAULT 'note',
    mood VARCHAR(10),
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_type (user_id, type),
    INDEX idx_user_date (user_id, date)
);

CREATE TABLE IF NOT EXISTS mood_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    mood VARCHAR(10),
    journal TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY (user_id, date),
     INDEX idx_user_month (user_id, date)
);

CREATE TABLE IF NOT EXISTS timer_presets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    label VARCHAR(255) NOT NULL,
    minutes INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user (user_id)
);

CREATE TABLE IF NOT EXISTS timer_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    duration INT NOT NULL, -- seconds
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
     INDEX idx_user_completed (user_id, completed_at)
);

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    notes TEXT,
    due_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_completed (user_id, completed),
    INDEX idx_user_due (user_id, due_date)
);

CREATE TABLE IF NOT EXISTS calendar_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    task TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_date (user_id, date)
);

CREATE TABLE IF NOT EXISTS motivation_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('image', 'video') NOT NULL,
    data_url TEXT NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user (user_id)
);

CREATE TABLE IF NOT EXISTS game_scores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    game_name VARCHAR(50) NOT NULL,
    high_score INT DEFAULT 0,
    last_play_score INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_game (user_id, game_name)
);
-- XÓA DỮ LIỆU CŨ
-- DELETE FROM inventory WHERE id>0;
-- DELETE FROM items WHERE id>0;
-- DELETE FROM pets WHERE id>0;
-- DELETE FROM users WHERE id>0;
-- ALTER TABLE items AUTO_INCREMENT = 1;
-- ALTER TABLE pets AUTO_INCREMENT = 1;
-- ALTER TABLE users AUTO_INCREMENT = 1;
-- ALTER TABLE inventory AUTO_INCREMENT = 1;

-- THÊM VÀO CUỐI FILE
-- Kiểm tra và cập nhật pet nếu gold = 0
-- UPDATE pets SET gold = 1000 WHERE gold = 0;

-- Tạo trigger để đảm bảo gold không âm
DELIMITER //
CREATE TRIGGER check_gold_before_update 
BEFORE UPDATE ON pets 
FOR EACH ROW 
BEGIN
    IF NEW.gold < 0 THEN
        SET NEW.gold = 0;
    END IF;
END// 
DELIMITER ;