// Emoji to Image Converter for AI Profile Pictures
// Generates PNG images from emoji characters for use as profile pictures

const fs = require('fs');
const path = require('path');

/**
 * Convert emoji to colorful profile image using Canvas API
 * Creates attractive gradient backgrounds with emoji text
 */
const convertEmojiToImage = async (emoji, size = 128) => {
  try {
    const { createCanvas } = require('canvas');
    
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Generate colors based on emoji unicode
    const emojiCode = emoji.codePointAt(0);
    const hue1 = (emojiCode * 137.5) % 360; // Golden angle for good distribution
    const hue2 = (hue1 + 60) % 360; // Complementary color
    
    // Create vibrant gradient background
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, `hsl(${hue1}, 75%, 80%)`);
    gradient.addColorStop(0.6, `hsl(${hue2}, 65%, 70%)`);
    gradient.addColorStop(1, `hsl(${hue1}, 70%, 55%)`);
    
    // Draw circular background
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Add subtle border
    ctx.strokeStyle = `hsl(${hue1}, 60%, 45%)`;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Add emoji text with shadow for depth
    ctx.font = `${size * 0.5}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillText(emoji, size / 2 + 2, size / 2 + 2);
    
    // Main emoji text in white
    ctx.fillStyle = '#ffffff';
    ctx.fillText(emoji, size / 2, size / 2);
    
    // Add a subtle highlight
    const highlightGradient = ctx.createRadialGradient(size/3, size/3, 0, size/3, size/3, size/4);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.fillRect(0, 0, size, size);
    
    // Convert to buffer
    const buffer = canvas.toBuffer('image/png');
    
    return {
      success: true,
      buffer,
      mimeType: 'image/png',
      size: buffer.length,
      colorful: true
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Failed to generate colorful emoji image: ${error.message}`
    };
  }
};

/**
 * Generate profile image from emoji and save to public static folder
 */
const generateProfileImage = async (emoji, userId, outputDir = '../static/emoji') => {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate image
    const result = await convertEmojiToImage(emoji, 128);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    // Create filename based on emoji and user for uniqueness
    const emojiCode = emoji.codePointAt(0).toString(16);
    const filename = `${emojiCode}-${userId.substring(0, 8)}.png`;
    const filepath = path.join(outputDir, filename);
    
    fs.writeFileSync(filepath, result.buffer);
    
    return {
      success: true,
      filepath,
      filename,
      url: `/emoji/${filename}`,
      size: result.size,
      fallback: result.fallback
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get emoji image URL for user, generating if needed
 */
const getEmojiImageUrl = async (emoji, userId) => {
  const profileDir = '../static/emoji';
  const emojiCode = emoji.codePointAt(0).toString(16);
  const filename = `${emojiCode}-${userId.substring(0, 8)}.png`;
  const filepath = path.join(profileDir, filename);
  
  // Check if image already exists
  if (fs.existsSync(filepath)) {
    return {
      success: true,
      url: `/emoji/${filename}`,
      cached: true
    };
  }
  
  // Generate new image
  const result = await generateProfileImage(emoji, userId, profileDir);
  return result;
};

module.exports = {
  convertEmojiToImage,
  generateProfileImage,
  getEmojiImageUrl
};