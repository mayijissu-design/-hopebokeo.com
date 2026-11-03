import { db, doc, getDoc } from '../lib/firebase';

// In-memory cache for resolved Firestore base64 image data URLs
const imageCache = new Map<string, string>();

/**
 * Given an image URL (such as /uploads/filename.jpg), if it fails to load via CDN/static server
 * (e.g. on Netlify or Vercel static deployments), this function fetches the high-definition
 * original image directly from Cloud Firestore's `uploaded_files` collection.
 */
export async function getFirestoreImageFallback(url: string): Promise<string | null> {
  if (!url || typeof url !== 'string') return null;

  // Already a base64 or blob URL
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // If cached in memory, return immediately
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }

  // Extract clean filename from URL (e.g. /uploads/image.jpg -> image.jpg)
  const cleanPath = url.split('?')[0].split('#')[0];
  const filename = cleanPath.split('/').pop();
  if (!filename) return null;

  try {
    const docId = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileDoc = await getDoc(doc(db, 'uploaded_files', docId));

    if (fileDoc.exists()) {
      const d = fileDoc.data();
      if (d?.data) {
        const mime = d.mimeType || 'image/jpeg';
        const dataUrl = `data:${mime};base64,${d.data}`;
        imageCache.set(url, dataUrl);
        return dataUrl;
      }
    }
  } catch (err) {
    console.warn(`Failed to resolve Firestore fallback for ${url}:`, err);
  }

  return null;
}

/**
 * Universal React image error handler. Attach to <img onError={handleImageErrorWithFirestore(fallbackUrl)} />
 * to automatically rescue missing /uploads/ URLs using the high-resolution original image from Firestore.
 */
export function handleImageErrorWithFirestore(fallbackDefault?: string) {
  return async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgEl = e.currentTarget;
    const originalSrc = imgEl.getAttribute('data-original-src') || imgEl.src;
    
    // Prevent infinite error loop if already attempted
    if (imgEl.getAttribute('data-fallback-attempted') === 'true') {
      if (fallbackDefault && imgEl.src !== fallbackDefault) {
        imgEl.src = fallbackDefault;
      }
      return;
    }
    imgEl.setAttribute('data-fallback-attempted', 'true');
    imgEl.setAttribute('data-original-src', originalSrc);

    const resolved = await getFirestoreImageFallback(originalSrc);
    if (resolved) {
      imgEl.src = resolved;
    } else if (fallbackDefault) {
      imgEl.src = fallbackDefault;
    }
  };
}
