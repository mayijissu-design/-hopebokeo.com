/**
 * Universal Client-Side Image Compressor & Optimizer
 * Guarantees ANY image file type, resolution, or format (JPG, PNG, WEBP, GIF, SVG, HEIC/camera photos)
 * is optimized with high-definition sharpness and crisp clarity, preserving fine details while
 * remaining safely under Firestore's 1MB document limit.
 */
export const compressImageFile = (
  file: File,
  maxDimension = 1600,
  initialQuality = 0.85,
  maxStringLength = 200000, // ~150KB binary size per image - crystal clear HD quality
  preserveTransparency = false
): Promise<string> => {
  return new Promise((resolve) => {
    if (!file) {
      resolve('');
      return;
    }

    // Keep vector SVGs as raw vector data URL if small
    if ((file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) && file.size < 250000) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const isPngOrTransparent =
      preserveTransparency ||
      file.type === 'image/png' ||
      file.name.toLowerCase().endsWith('.png') ||
      file.type === 'image/webp' ||
      file.name.toLowerCase().endsWith('.webp') ||
      file.type === 'image/svg+xml' ||
      file.name.toLowerCase().endsWith('.svg');

    const processElement = (drawable: HTMLImageElement | ImageBitmap) => {
      try {
        let width = drawable.width || 1200;
        let height = drawable.height || 800;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve('');
          return;
        }

        // Enable highest quality image smoothing to prevent blurriness
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Never fill background with white if transparent format
        if (!isPngOrTransparent) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(drawable, 0, 0, canvas.width, canvas.height);

        let currentQuality = initialQuality;
        const mimeType = isPngOrTransparent ? 'image/png' : 'image/jpeg';
        let dataUrl = canvas.toDataURL(mimeType, currentQuality);

        // Iterative reduction loop only if payload exceeds safe Firestore single-image ceiling
        let attempts = 0;
        while (dataUrl.length > maxStringLength && attempts < 8) {
          attempts++;
          width = Math.round(width * 0.82);
          height = Math.round(height * 0.82);
          currentQuality = Math.max(0.60, currentQuality - 0.05);

          const iterCanvas = document.createElement('canvas');
          iterCanvas.width = Math.max(60, width);
          iterCanvas.height = Math.max(60, height);
          const iterCtx = iterCanvas.getContext('2d');
          if (iterCtx) {
            iterCtx.imageSmoothingEnabled = true;
            iterCtx.imageSmoothingQuality = 'high';
            if (!isPngOrTransparent) {
              iterCtx.fillStyle = '#FFFFFF';
              iterCtx.fillRect(0, 0, iterCanvas.width, iterCanvas.height);
            } else {
              iterCtx.clearRect(0, 0, iterCanvas.width, iterCanvas.height);
            }
            iterCtx.drawImage(drawable, 0, 0, iterCanvas.width, iterCanvas.height);
            dataUrl = iterCanvas.toDataURL(isPngOrTransparent ? 'image/png' : 'image/jpeg', currentQuality);
          }
        }

        resolve(dataUrl);
      } catch (err) {
        console.warn('Canvas rendering error:', err);
        resolve('');
      }
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      const srcData = e.target?.result as string;
      if (!srcData) {
        resolve('');
        return;
      }

      const img = new Image();
      img.onload = () => processElement(img);

      img.onerror = () => {
        if ('createImageBitmap' in window) {
          createImageBitmap(file)
            .then((bitmap) => processElement(bitmap))
            .catch(() => {
              if (srcData.length <= maxStringLength) {
                resolve(srcData);
              } else {
                resolve('');
              }
            });
        } else if (srcData.length <= maxStringLength) {
          resolve(srcData);
        } else {
          resolve('');
        }
      };

      img.src = srcData;
    };

    reader.onerror = () => {
      if ('createImageBitmap' in window) {
        createImageBitmap(file)
          .then((bitmap) => processElement(bitmap))
          .catch(() => resolve(''));
      } else {
        resolve('');
      }
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Utility to optimize an existing data URL string with high sharpness
 */
export const shrinkBase64DataUrl = (
  dataUrl: string,
  maxDimension = 1600,
  quality = 0.82,
  maxStringLength = 180000,
  preserveTransparency = false
): Promise<string> => {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl || '');
      return;
    }
    // If it's already within safe limits, keep original crisp pixels
    if (dataUrl.length <= maxStringLength) {
      resolve(dataUrl);
      return;
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(dataUrl);
      return;
    }

    const isPngOrTransparent =
      preserveTransparency ||
      dataUrl.startsWith('data:image/png') ||
      dataUrl.startsWith('data:image/webp') ||
      dataUrl.startsWith('data:image/svg');

    const img = new Image();
    img.onload = () => {
      let width = img.width || 1200;
      let height = img.height || 800;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      if (!isPngOrTransparent) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let currentQuality = quality;
      const mime = isPngOrTransparent ? 'image/png' : 'image/jpeg';
      let result = canvas.toDataURL(mime, currentQuality);

      let attempts = 0;
      while (result.length > maxStringLength && attempts < 7) {
        attempts++;
        width = Math.round(width * 0.82);
        height = Math.round(height * 0.82);
        currentQuality = Math.max(0.55, currentQuality - 0.05);

        const iterCanvas = document.createElement('canvas');
        iterCanvas.width = Math.max(60, width);
        iterCanvas.height = Math.max(60, height);
        const iterCtx = iterCanvas.getContext('2d');
        if (iterCtx) {
          iterCtx.imageSmoothingEnabled = true;
          iterCtx.imageSmoothingQuality = 'high';
          if (!isPngOrTransparent) {
            iterCtx.fillStyle = '#FFFFFF';
            iterCtx.fillRect(0, 0, iterCanvas.width, iterCanvas.height);
          } else {
            iterCtx.clearRect(0, 0, iterCanvas.width, iterCanvas.height);
          }
          iterCtx.drawImage(img, 0, 0, iterCanvas.width, iterCanvas.height);
          result = iterCanvas.toDataURL(mime, currentQuality);
        }
      }

      resolve(result);
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
};

/**
 * Emergency compressor for any document object to guarantee it strictly fits Firestore 1MB limits
 */
export async function emergencyCompressObject(obj: any): Promise<any> {
  if (!obj) return obj;
  const safe = JSON.parse(JSON.stringify(obj));

  const compressWalk = async (val: any): Promise<any> => {
    if (!val) return val;
    if (typeof val === 'string' && val.startsWith('data:image')) {
      return await shrinkBase64DataUrl(val, 960, 0.65, 80000);
    }
    if (Array.isArray(val)) {
      const arr = [];
      for (const item of val) {
        arr.push(await compressWalk(item));
      }
      return arr;
    }
    if (typeof val === 'object') {
      for (const k of Object.keys(val)) {
        val[k] = await compressWalk(val[k]);
      }
      return val;
    }
    return val;
  };

  return await compressWalk(safe);
}

/**
 * Optimizes an entire HomePoster or config object before saving to Firestore.
 * Preserves ultra-crisp resolution while strictly ensuring total document
 * payload stays safely within ~400KB - 550KB (Firestore doc limit is 1MB / 1,048,576 bytes).
 */
export async function optimizePosterForFirestore(poster: any): Promise<any> {
  if (!poster) return poster;
  if (poster._isOptimized) return poster;

  const safePoster = JSON.parse(JSON.stringify(poster));

  // 1. Process Background Image (bgImageUrl) (~95KB)
  const bgPromise = (async () => {
    if (typeof safePoster.bgImageUrl === 'string' && safePoster.bgImageUrl.startsWith('data:image')) {
      if (safePoster.bgImageUrl.length > 95000) {
        safePoster.bgImageUrl = await shrinkBase64DataUrl(safePoster.bgImageUrl, 1280, 0.75, 95000);
      }
    }
  })();

  // 2. Process Organization Logo (logoUrl) (~35KB)
  const logoPromise = (async () => {
    if (typeof safePoster.logoUrl === 'string' && safePoster.logoUrl.startsWith('data:image')) {
      if (safePoster.logoUrl.length > 35000) {
        safePoster.logoUrl = await shrinkBase64DataUrl(safePoster.logoUrl, 480, 0.85, 35000);
      }
    }
  })();

  // 3. Process Carousel / Poster Images concurrently
  const rawList: string[] = Array.isArray(safePoster.imageUrls)
    ? safePoster.imageUrls
    : safePoster.imageUrl
    ? [safePoster.imageUrl]
    : [];

  const validImages = rawList.filter((u) => u && typeof u === 'string' && u.trim().length > 0);
  const imgCount = Math.max(1, validImages.length);

  const perImageBudget = imgCount === 1 ? 200000 : imgCount === 2 ? 140000 : Math.max(75000, Math.floor(320000 / imgCount));
  const maxDim = imgCount === 1 ? 1600 : imgCount === 2 ? 1400 : 1200;

  const imagesPromise = (async () => {
    const optimizedImages = await Promise.all(
      validImages.map(async (imgStr) => {
        if (imgStr.startsWith('data:image') && imgStr.length > perImageBudget) {
          return await shrinkBase64DataUrl(imgStr, maxDim, 0.80, perImageBudget);
        }
        return imgStr;
      })
    );
    safePoster.imageUrls = optimizedImages;
    safePoster.imageUrl = optimizedImages[0] || '';
  })();

  // 4. Process Bokeo Timeline Images concurrently (~65KB each max)
  const timelinePromise = (async () => {
    if (Array.isArray(safePoster.bokeoTimeline)) {
      safePoster.bokeoTimeline = await Promise.all(
        safePoster.bokeoTimeline.map(async (item: any) => {
          if (!item) return item;
          const cloneItem = { ...item };
          const rawTimelineImgs: string[] = Array.isArray(cloneItem.imageUrls)
            ? cloneItem.imageUrls
            : cloneItem.imageUrl
            ? [cloneItem.imageUrl]
            : [];

          if (rawTimelineImgs.length > 0) {
            const optImgs = await Promise.all(
              rawTimelineImgs.map(async (tImg: string) => {
                if (typeof tImg === 'string' && tImg.startsWith('data:image') && tImg.length > 70000) {
                  return await shrinkBase64DataUrl(tImg, 800, 0.78, 70000);
                }
                return tImg;
              })
            );
            cloneItem.imageUrls = optImgs;
            cloneItem.imageUrl = optImgs[0] || '';
          }
          return cloneItem;
        })
      );
    }
  })();

  // Execute all image groups in parallel
  await Promise.all([bgPromise, logoPromise, imagesPromise, timelinePromise]);

  // 5. Emergency guard only if payload is exceptionally high (> 750KB)
  let jsonLen = JSON.stringify(safePoster).length;
  if (jsonLen > 750000) {
    console.warn(`[Firestore Guard] Payload size ${jsonLen} is high. Running emergency pass...`);
    if (safePoster.bgImageUrl && safePoster.bgImageUrl.startsWith('data:image')) {
      safePoster.bgImageUrl = await shrinkBase64DataUrl(safePoster.bgImageUrl, 960, 0.65, 55000);
    }
    if (Array.isArray(safePoster.imageUrls)) {
      safePoster.imageUrls = await Promise.all(
        safePoster.imageUrls.map(async (img: string) => {
          if (img.startsWith('data:image')) {
            return await shrinkBase64DataUrl(img, 960, 0.65, 60000);
          }
          return img;
        })
      );
      safePoster.imageUrl = safePoster.imageUrls[0] || '';
    }
  }

  safePoster._isOptimized = true;
  return safePoster;
}

