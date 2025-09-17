require("dotenv").config();
const express = require("express");
const cors = require("cors");
const database = require("./config/database");
const router = require("./routes/index.route");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api", router);
app.get("/", (req, res) => {
  res.send("API running");
});

(async () => {
  await database.connect();
  app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
  });
})();
