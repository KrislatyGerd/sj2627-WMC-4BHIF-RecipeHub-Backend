import { Ingredient } from "./Ingredient";

export interface Recipe {
    id: number;
    title: string;
    description: string;
    duration: number;
    imageUrl: string;
    instructions: string;
    ingredients: Ingredient[];
}
