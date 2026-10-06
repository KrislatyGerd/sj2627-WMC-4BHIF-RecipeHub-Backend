import express from "express";
import cors from "cors";
import jsonData from "../assets/temp-data.json";
import mariadb from "mariadb";

const app = express();
const PORT = 3000;

const pool = mariadb.createPool({
    host: "localhost",
    user: "root",
    password: "example",
    database: "recipes_db", // Datenbankname 
    port: 3308, // Standardport für MariaDB ist 3306, hier 3308
});

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

// app.get("/api/recipe", (req, res) => {
//     res.json(jsonData);
// });

// GET-Endpoint für /api/recipes 
app.get("/api/recipes",async (req, res) => {
    try {
        const connection = await pool.getConnection();
        // Erste SQL-Abfrage, um alle Rezepte zu erhalten 
        const recipeRows = await connection.query(` 
                SELECT  
                    id AS recipe_id, 
                    title, 
                    description, 
                    duration, 
                    imageUrl, 
                    instructions 
                FROM  
                    recipes 
            `);
        // Zweite SQL-Abfrage, um alle Zutaten für die Rezepte zu erhalten 
        const ingredientRows = await connection.query(` 
                SELECT  
                    id AS ingredient_id, 
                    recipe_id, 
                    name AS ingredient_name, 
                    amount AS ingredient_amount 
                FROM  
                    ingredients 
            `);
        // Rezepte strukturieren 
        const recipes = recipeRows.map((recipe) => {
            // Finde die zugehörigen Zutaten für das aktuelle Rezept 
            const ingredients = ingredientRows
                .filter((ingredient) => ingredient.recipe_id === recipe.recipe_id)
                .map((ingredient) => ({
                    id: ingredient.ingredient_id,
                    name: ingredient.ingredient_name,
                    amount: ingredient.ingredient_amount,
                }));
            return {
                id: recipe.recipe_id,
                title: recipe.title,
                description: recipe.description,
                duration: recipe.duration,
                imageUrl: recipe.imageUrl,
                instructions: recipe.instructions,
                ingredients: ingredients,
            };
        });
        res.json(recipes);
        connection.release();
    } catch (error) {
        console.error("Error fetching recipes:", error);
        res.status(500).json({ message: "Error fetching recipes" });
    }
});

// app.get("/api/recipe/:id", (req, res) => {
//     const recipe = jsonData.find((r) => r.id === req.params.id);
//     if (!recipe) {
//         return res.status(404).json({ message: "Rezept nicht gefunden" });
//     }
//     res.json(recipe);
// });

app.get("/api/recipes/:id", async (req, res) => {
    const recipeId = req.params.id;
    console.log("Fetching recipe with ID:", recipeId);  
    try {
        const connection = await pool.getConnection();

        // Rezept mit bestimmter ID laden
        const [recipe] = await connection.query(`
            SELECT  
                id AS recipe_id, 
                title, 
                description, 
                duration, 
                imageUrl, 
                instructions 
            FROM  
                recipes
            WHERE id = ?
            `, [recipeId]);

        if (!recipe) {
            connection.release();
            return res.status(404).json({ message: "Recipe not found" });
        }

        // Zutaten des Rezepts laden
        const ingredientRows = await connection.query(`
            SELECT  
                id AS ingredient_id, 
                recipe_id, 
                name AS ingredient_name, 
                amount AS ingredient_amount 
            FROM  
                ingredients
            WHERE recipe_id = ?
            `, [recipeId]);

        // Strukturieren
        const ingredients = ingredientRows.map((ingredient) => ({
            id: ingredient.ingredient_id,
            name: ingredient.ingredient_name,
            amount: ingredient.ingredient_amount,
        }));

        const recipeData = {
            id: recipe.recipe_id,
            title: recipe.title,
            description: recipe.description,
            duration: recipe.duration,
            imageUrl: recipe.imageUrl,
            instructions: recipe.instructions,
            ingredients,
        };
        console.log("Fetched recipe data:", recipeData);
        res.json(recipeData);
        connection.release();
    } catch (error) {
        console.error("Error fetching recipe:", error);
        res.status(500).json({ message: "Error fetching recipe" });
    }
});


app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});