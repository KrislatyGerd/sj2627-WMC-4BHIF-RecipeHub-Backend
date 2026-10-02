import express from "express";
import cors from "cors";
import jsonData from "../assets/temp-data.json";

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

app.get("/api/recipe", (req, res) => {
    res.json(jsonData);
});

app.get("/api/recipe/:id", (req, res) => {
    const recipe = jsonData.find((r) => r.id === req.params.id);
    if (!recipe) {
        return res.status(404).json({ message: "Rezept nicht gefunden" });
    }
    res.json(recipe);
});

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});