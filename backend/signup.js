// app.post("/signup", async (req, res) => {
//     const { username, password } = req.body;

//     const [exists] = await db.query("SELECT * FROM users WHERE username=?", [username]);
//     if (exists.length > 0) return res.json({ error: "User exists" });

//     await db.query("INSERT INTO users(username, password) VALUES (?, ?)", [username, password]);

//     res.json({ status: "ok" });
// });
