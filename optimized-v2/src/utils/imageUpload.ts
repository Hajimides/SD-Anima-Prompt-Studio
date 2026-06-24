export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  type?: string;
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function compressImage(
  dataUrl: string,
  options: ImageUploadOptions = {}
): Promise<string> {
  const { maxWidth = 800, maxHeight = 800, quality = 0.85, type = 'image/jpeg' } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL(type, quality));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

export async function processImageUpload(
  file: File,
  options?: ImageUploadOptions
): Promise<string> {
  const dataUrl = await readFileAsDataURL(file);
  // Only compress raster images
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file');
  }
  // GIFs usually don't compress well via canvas, keep as-is
  if (file.type === 'image/gif') {
    return dataUrl;
  }
  return compressImage(dataUrl, options);
}
