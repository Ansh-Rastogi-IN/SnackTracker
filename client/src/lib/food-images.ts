// Food images configuration for the prototype
// Using local photos from assets/images folder
import { getLocalFoodImage } from './image-imports';

export const foodImages: Record<string, string> = {};

// Function to get image URL for a menu item
export function getFoodImage(itemName: string, category?: string): string {
  // First try to get local image
  const localImage = getLocalFoodImage(itemName);
  if (localImage) {
    return localImage;
  }
  
  // Then try to find exact match in foodImages
  if (foodImages[itemName]) {
    return foodImages[itemName];
  }
  
  // Then try category fallback
  if (category && foodImages[category]) {
    return foodImages[category];
  }
  
  // Finally return default
  return foodImages.default;
}

// Function to get category-specific image
export function getCategoryImage(category: string): string {
  return foodImages[category] || foodImages.default;
} 