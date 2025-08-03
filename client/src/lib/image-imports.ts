// Image imports for local food photos
// This file handles importing local images for use in the application

// Import all food images
import burgerImg from '../assets/images/burger.webp';
import cheeseMaggieImg from '../assets/images/cheese maggie.webp';
import paneerPuffImg from '../assets/images/paneer puff.webp';
import masalaDosaImg from '../assets/images/masala dosa.webp';

// Export image mapping
export const localFoodImages: Record<string, string> = {
  "Veg Burger": burgerImg,
  "Cheese Maggi": cheeseMaggieImg,
  "Paneer Puff": paneerPuffImg,
  "Masala Dosa": masalaDosaImg,
  "Dosa": masalaDosaImg, // Alias for Dosa
};

// Function to get local image URL
export function getLocalFoodImage(itemName: string): string | null {
  return localFoodImages[itemName] || null;
} 