/**
 * Get full image URL from relative path
 * @param imagePath - Relative image path (e.g., /uploads/image.jpg)
 * @returns Full URL to the image
 */
export function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // Construct full URL with backend base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
  
  return `${API_BASE_URL}/${cleanPath}`
}

