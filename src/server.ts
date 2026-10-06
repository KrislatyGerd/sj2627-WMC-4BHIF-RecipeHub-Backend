import express from "express";
import cors from "cors";
import jsonData from "../assets/temp-data.json";
import mariadb from "mariadb";
import { Ingredient } from "./models/Ingredient";
import { Recipe } from "./models/Recipe";
import { RecipeRow } from "./models/RecipeRow";
import { IngredientRow } from "./models/IngredientRow";

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
// GET-Endpoint für /api/recipes
app.get("/api/recipes", async (req, res) => {

    let connection;

    try {

        connection = await pool.getConnection();

        const recipeRows = await connection.query(`
            SELECT
                id AS recipe_id,
                title,
                description,
                duration,
                imageUrl,
                instructions
            FROM recipes
        `) as RecipeRow[];

        const ingredientRows = await connection.query(`
            SELECT
                id AS ingredient_id,
                recipe_id,
                name AS ingredient_name,
                amount AS ingredient_amount
            FROM ingredients
        `) as IngredientRow[];

        const recipes: Recipe[] = recipeRows.map((recipe) => ({
            id: recipe.recipe_id,
            title: recipe.title,
            description: recipe.description,
            duration: recipe.duration,
            imageUrl: recipe.imageUrl,
            instructions: recipe.instructions,

            ingredients: ingredientRows
                .filter(
                    (ingredient) =>
                        ingredient.recipe_id === recipe.recipe_id
                )
                .map((ingredient) => ({
                    id: ingredient.ingredient_id,
                    name: ingredient.ingredient_name,
                    amount: ingredient.ingredient_amount
                }))
        }));

        res.json(recipes);

    } catch (error) {

        console.error("Error fetching recipes:", error);

        res.status(500).json({
            message: "Error fetching recipes"
        });

    } finally {

        connection?.release();
    }
});

app.get("/api/recipes/:id", async (req, res) => {

    const recipeId = req.params.id;

    console.log("Fetching recipe with ID:", recipeId);

    let connection;

    try {

        connection = await pool.getConnection();

        // Rezept mit bestimmter ID laden
        const recipeRows = await connection.query(`
            SELECT
                id AS recipe_id,
                title,
                description,
                duration,
                imageUrl,
                instructions
            FROM recipes
            WHERE id = ?
        `, [recipeId]) as RecipeRow[];

        // Wurde das Rezept gefunden?
        if (recipeRows.length === 0) {
            return res.status(404).json({
                message: "Recipe not found"
            });
        }

        const recipe = recipeRows[0];

        // Zutaten des Rezepts laden
        const ingredientRows = await connection.query(`
            SELECT
                id AS ingredient_id,
                recipe_id,
                name AS ingredient_name,
                amount AS ingredient_amount
            FROM ingredients
            WHERE recipe_id = ?
        `, [recipeId]) as IngredientRow[];

        // Zutaten strukturieren
        const ingredients: Ingredient[] = ingredientRows.map(
            (ingredient) => ({
                id: ingredient.ingredient_id,
                name: ingredient.ingredient_name,
                amount: ingredient.ingredient_amount
            })
        );

        // Rezept strukturieren
        const recipeData: Recipe = {
            id: recipe.recipe_id,
            title: recipe.title,
            description: recipe.description,
            duration: recipe.duration,
            imageUrl: recipe.imageUrl,
            instructions: recipe.instructions,
            ingredients
        };

        console.log("Fetched recipe data:", recipeData);

        res.json(recipeData);

    } catch (error) {

        console.error("Error fetching recipe:", error);

        res.status(500).json({
            message: "Error fetching recipe"
        });

    } finally {

        connection?.release();
    }
});

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});