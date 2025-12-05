// // // authMiddleware.js
// // const jwt = require("jsonwebtoken");
// // const JWT_SECRET = process.env.JWT_SECRET || "secret";

// // function auth(req, res, next) {
// //   const authHeader = req.headers.authorization;
// //   if (!authHeader) return res.status(401).json({ error: "Missing token" });
// //   const token = authHeader.split(" ")[1];
// //   try {
// //     const data = jwt.verify(token, JWT_SECRET);
// //     req.user = data;
// //     next();
// //   } catch (e) {
// //     return res.status(401).json({ error: "Invalid token" });
// //   }
// // }

// // module.exports = auth;
// // backend/middleware/authMiddleware.js
// module.exports = (req, res, next) => {
//   // Tạm thời cho phép tất cả request
//   // Trong thực tế sẽ kiểm tra JWT token
//   req.user = { userId: 1, id: 1 }; // User mặc định
//   next();
// };

// middleware/auth.js
const mockUsers = [
  { id: 1, username: 'test', password: 'test', token: 'mock-token-123' }
];

function authMiddleware(req, res, next) {
  // Cho phép tất cả file tĩnh
  const ext = req.path.split('.').pop();
  const staticExtensions = ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'ico', 'svg', 'woff', 'woff2', 'ttf', 'html'];
  
  if (staticExtensions.includes(ext)) {
    return next();
  }
  
  // Bỏ qua auth cho các route công khai
  const publicPaths = [
    '/', '/auth/login', '/auth/signup', '/login.html',
    '/cleaning_room.html', '/home.html', '/office_room.html',
    '/games_room.html', '/kitchen.html', '/bed_room.html', '/pics_room.html'
  ];
  
  if (publicPaths.includes(req.path)) {
    return next();
  }
  
  // Kiểm tra token cho API routes
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = mockUsers.find(u => u.token === token);
    
    if (user) {
      req.user = { userId: user.id, id: user.id };
      return next();
    }
  }
  
  console.log('❌ Unauthorized access to:', req.path);
  return res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { authMiddleware, mockUsers };