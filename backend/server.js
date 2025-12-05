// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const petRoutes = require("./routes/pet");
const itemsRoutes = require("./routes/items");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use('/api/items', require('./routes/items'));
app.use('/api/pet', require('./routes/pet'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on http://localhost:" + PORT));
