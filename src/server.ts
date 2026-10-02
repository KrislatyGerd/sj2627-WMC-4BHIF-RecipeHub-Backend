import express from "express";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Express Server läuft!");
});

app.get("/api/hello", (req, res) => {
    res.json({
        message: "Hallo von Express + TypeScript!"
    });
});

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});