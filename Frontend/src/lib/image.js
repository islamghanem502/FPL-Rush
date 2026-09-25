// Read a picked file, downscale it in the browser and return a JPEG data URL.
// Keeps uploads small (< 1MB) before they hit the backend/Cloudinary.
export const readImage = (file, { maxSide = 1400, maxBytes = 5 * 1024 * 1024 } = {}) =>
  new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) return reject(new Error('اختر ملف صورة (JPG أو PNG أو WEBP)'));
    if (file.size > maxBytes) return reject(new Error('حجم الصورة يجب ألا يتجاوز 5MB'));

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة الصورة'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('تعذر فتح الصورة'));
      image.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
