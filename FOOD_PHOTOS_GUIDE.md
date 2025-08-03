# 🍽️ Food Photos Guide - SnackTracker

## How to Add Your Own Food Photos

### **Step 1: Prepare Your Photos**
1. **Format**: Use `.webp`, `.jpg`, `.png`, or `.jpeg` formats
2. **Naming**: Name your photos exactly like the food item names in the menu
3. **Examples**:
   - `Veg Sandwich.jpg`
   - `Chicken Burger.webp`
   - `Masala Chai.png`

### **Step 2: Add Photos to the Project**
1. **Copy your photos** to: `client/src/assets/images/`
2. **Or use the command**:
   ```bash
   copy "your_photos_folder\*" "client\src\assets\images\"
   ```

### **Step 3: Update Image Imports**
1. **Open**: `client/src/lib/image-imports.ts`
2. **Add import statements** for your new photos:
   ```typescript
   import vegSandwichImg from '../assets/images/Veg Sandwich.jpg';
   import chickenBurgerImg from '../assets/images/Chicken Burger.webp';
   ```

3. **Add to the mapping**:
   ```typescript
   export const localFoodImages: Record<string, string> = {
     "Veg Sandwich": vegSandwichImg,
     "Chicken Burger": chickenBurgerImg,
     // ... existing items
   };
   ```

### **Step 4: Test Your Changes**
1. **Restart the development server** if needed
2. **Check the menu** to see your new photos
3. **Photos will automatically appear** for matching food item names

### **Current Local Photos**
- ✅ `burger.webp` → "Veg Burger"
- ✅ `cheese maggie.webp` → "Cheese Maggi"
- ✅ `paneer puff.webp` → "Paneer Puff"
- ✅ `masala dosa.webp` → "Masala Dosa"

### **Tips**
- **Case sensitive**: Photo names must match exactly
- **File extensions**: Include the extension in the import
- **Fallback system**: If no local photo found, it uses Unsplash images
- **Hot reload**: Changes appear immediately in development

### **Example: Adding "Veg Sandwich" Photo**
1. Save photo as: `client/src/assets/images/Veg Sandwich.jpg`
2. Add to `image-imports.ts`:
   ```typescript
   import vegSandwichImg from '../assets/images/Veg Sandwich.jpg';
   
   export const localFoodImages: Record<string, string> = {
     "Veg Sandwich": vegSandwichImg,
     // ... existing items
   };
   ```
3. Done! The photo will appear automatically.

---

**🎉 Your local food photos are now integrated into SnackTracker!** 