USE petgame;

INSERT IGNORE INTO items (name,type,hunger_change,happiness_change,health_change,energy_change,price,img)  VALUES
('Cheri','food',-5,0,5,3,5,'cherry.png'),
('Nho','food',-5,0,5,3,5,'grape.png'),
('Cam','food',-5,0,5,3,5,'orange.png'),
('Dưa hấu','food',-5,0,5,5,10,'watermelon.png'),
('Dâu','food',-5,0,5,3,5,'strawberry.png'),
('Dứa','food',-5,0,0,3,5,'pineapple.png'),
('Cà chua','food',-5,0,0,2,2,'tomato.png'),
('Chanh','food',-3,-1,0,3,3,'lemon.png'),
('Ớt','food',-3,-1,0,1,2,'chili.png'),
('Nước lọc','food',-3,-1,0,5,5,'water.png'),
('Coca','food',-15,0,-5,10,20,'coke.png'),
('Nước cam','food',-15,0,0,11,20,'orange_juice.png'),
('Trà sữa','food',-15,3,-3,10,25,'milk_tea.png'),
('Sữa','food',-15,0,2,10,20,'milk.png'),
('Khoai tây chiên','food',-25,0,0,15,30,'fries.png'),
('Mì','food',-25,0,0,30,50,'noodles.png'),
('Bánh kem','food',25,10,0,40,70,'cake.png'),
('Gà rán','food',-25,0,0,35,55,'fried_chicken.png'),
('Chống đói','potion',-50,0,0,0,100,'anti_hunger.png'),
('Đi chơi','potion',0,50,0,0,100,'fun_boost.png'),
('Khám bệnh','potion',0,0,50,0,100,'medical_check.png'),
('Nghỉ ngơi','potion',0,0,0,50,100,'rest_boost.png'),
('+50V -25SK','potion',0,50,-25,0,75,'happy50_minus25health.png'),
('+50SK -30V','potion',0,-30,50,0,75,'health50_minus30happy.png'),
('+75NL -20SK','potion',0,0,-20,75,75,'energy75_minus20health.png'),
('+30NL +20Đ','potion',20,0,0,30,75,'energy30_hunger20.png');
-- INSERT IGNORE INTO shop_items (name,type,hunger_change,happiness_change,health_change,energy_change,price,image) VALUES
-- ('Cheri','food',-5,0,5,3,5,'cherry.png'),
-- ('Nho','food',-5,0,5,3,5,'grape.png'),
-- ('Cam','food',-5,0,5,3,5,'orange.png'),
-- ('Dưa hấu','food',-5,0,5,5,10,'watermelon.png'),
-- ('Dâu','food',-5,0,5,3,5,'strawberry.png'),
-- ('Dứa','food',-5,0,0,3,5,'pineapple.png'),
-- ('Cà chua','food',-5,0,0,2,2,'tomato.png'),
-- ('Chanh','food',-3,-1,0,3,3,'lemon.png'),
-- ('Ớt','food',-3,-1,0,1,2,'chili.png'),
-- ('Nước lọc','food',-3,-1,0,5,5,'water.png'),
-- ('Coca','food',-15,0,-5,10,20,'coke.png'),
-- ('Nước cam','food',-15,0,0,11,20,'orange_juice.png'),
-- ('Trà sữa','food',-15,3,-3,10,25,'milk_tea.png'),
-- ('Sữa','food',-15,0,2,10,20,'milk.png'),
-- ('Khoai tây chiên','food',-25,0,0,15,30,'fries.png'),
-- ('Mì','food',-25,0,0,30,50,'noodles.png'),
-- ('Bánh kem','food',25,10,0,40,70,'cake.png'),
-- ('Gà rán','food',-25,0,0,35,55,'fried_chicken.png'),
-- ('Chống đói','potion',-50,0,0,0,100,'anti_hunger.png'),
-- ('Đi chơi','potion',0,50,0,0,100,'fun_boost.png'),
-- ('Khám bệnh','potion',0,0,50,0,100,'medical_check.png'),
-- ('Nghỉ ngơi','potion',0,0,0,50,100,'rest_boost.png'),
-- ('+50V -25SK','potion',0,50,-25,0,75,'happy50_minus25health.png'),
-- ('+50SK -30V','potion',0,-30,50,0,75,'health50_minus30happy.png'),
-- ('+75NL -20SK','potion',0,0,-20,75,75,'energy75_minus20health.png'),
-- ('+30NL +20Đ','potion',20,0,0,30,75,'energy30_hunger20.png');


-- CHÈN USER TEST (chỉ nếu chưa có)
INSERT IGNORE INTO users (id, username, password) VALUES (1, 'test', 'test');
-- CHÈN PET CHO USER TEST (chỉ nếu chưa có)
INSERT IGNORE INTO pets (user_id, name, gold, hunger, happiness, health, energy) 
VALUES (1, 'Baby', 1000, 100, 100, 100, 100);

-- CHÈN INVENTORY MẪU (chỉ nếu chưa có)
INSERT IGNORE INTO inventory (user_id, item_id, quantity) VALUES
(1, 1, 5),  -- 5 Cheri
(1, 4, 3),  -- 3 Dưa hấu
(1, 11, 2); -- 2 Coca

-- HIỆN THỊ KẾT QUẢ
SELECT '=== USERS ===' as '';
SELECT * FROM users;

SELECT '=== PETS ===' as '';
SELECT * FROM pets;

SELECT '=== ITEMS ===' as '';
SELECT id, name, type, price FROM items ORDER BY id;

SELECT '=== INVENTORY ===' as '';
SELECT * FROM inventory;

SELECT '=== TỔNG QUAN ===' as '';
SELECT 
  u.username,
  p.name as pet_name,
  p.gold,
  p.hunger,
  p.happiness,
  p.health,
  p.energy,
  COUNT(DISTINCT i.item_id) as unique_items,
  SUM(i.quantity) as total_items
FROM users u
LEFT JOIN pets p ON u.id = p.user_id
LEFT JOIN inventory i ON u.id = i.user_id
WHERE u.id = 1
GROUP BY u.id;

SELECT '✅ Seed data inserted (only if not exists)!' as '';
select * from users;