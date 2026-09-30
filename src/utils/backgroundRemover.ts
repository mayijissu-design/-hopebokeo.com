/**
 * Client-Side Smart Background Removal Tool for Logos & Graphics
 * 
 * Removes white, light, or solid backgrounds from logos completely on the client side,
 * converting them to clean, transparent PNGs with smooth anti-aliased edges and anti-halo defringing.
 */

export interface BgRemovalOptions {
  tolerance?: number; // 5 - 80 (default 35)
  mode?: 'flood' | 'all'; // 'flood' = edge-connected only (preserves enclosed white parts), 'all' = remove all matching color
  customColor?: { r: number; g: number; b: number } | null;
  feather?: boolean;
}

export const removeImageBackground = (
  imageSrc: string,
  options: BgRemovalOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!imageSrc) {
      resolve('');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Cap dimension for instantaneous client-side processing (< 100ms)
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = Math.round((height * maxDim) / width);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        // Draw source image cleanly
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const totalPixels = width * height;

        const tolerance = options.tolerance ?? 35;
        const mode = options.mode ?? 'flood';
        const feather = options.feather ?? true;

        // 1. Detect background color from corners & border pixels
        let bgR = 255;
        let bgG = 255;
        let bgB = 255;

        if (options.customColor) {
          bgR = options.customColor.r;
          bgG = options.customColor.g;
          bgB = options.customColor.b;
        } else {
          // Sample four corners and edge midpoints
          const samplePoints = [
            [0, 0],
            [width - 1, 0],
            [0, height - 1],
            [width - 1, height - 1],
            [Math.floor(width / 2), 0],
            [Math.floor(width / 2), height - 1],
            [0, Math.floor(height / 2)],
            [width - 1, Math.floor(height / 2)],
          ];

          let sumR = 0;
          let sumG = 0;
          let sumB = 0;
          let validSamples = 0;

          samplePoints.forEach(([x, y]) => {
            const idx = (y * width + x) * 4;
            // only sample if pixel is opaque
            if (data[idx + 3] > 100) {
              sumR += data[idx];
              sumG += data[idx + 1];
              sumB += data[idx + 2];
              validSamples++;
            }
          });

          if (validSamples > 0) {
            bgR = Math.round(sumR / validSamples);
            bgG = Math.round(sumG / validSamples);
            bgB = Math.round(sumB / validSamples);
          }
        }

        const colorDist = (r: number, g: number, b: number) => {
          // Weighted Euclidean color distance (closer to human perception)
          const rmean = (r + bgR) / 2;
          const rDiff = r - bgR;
          const gDiff = g - bgG;
          const bDiff = b - bgB;
          return Math.sqrt(
            (((512 + rmean) * rDiff * rDiff) >> 8) +
              4 * gDiff * gDiff +
              (((767 - rmean) * bDiff * bDiff) >> 8)
          );
        };

        // Standard tolerance scaled to perceptual color distance (max ~765)
        const tolDist = tolerance * 4.5;
        const coreDist = tolDist * 0.7;

        if (mode === 'flood') {
          // Edge-connected Flood Fill (BFS): only transparentize background connected to edges!
          const visited = new Uint8Array(totalPixels);
          const queue = new Int32Array(totalPixels);
          let head = 0;
          let tail = 0;

          // Push all outer border pixels to start
          for (let x = 0; x < width; x++) {
            queue[tail++] = x; // Top edge
            visited[x] = 1;
            const bIdx = (height - 1) * width + x; // Bottom edge
            queue[tail++] = bIdx;
            visited[bIdx] = 1;
          }
          for (let y = 1; y < height - 1; y++) {
            const lIdx = y * width; // Left edge
            queue[tail++] = lIdx;
            visited[lIdx] = 1;
            const rIdx = y * width + (width - 1); // Right edge
            queue[tail++] = rIdx;
            visited[rIdx] = 1;
          }

          while (head < tail) {
            const p = queue[head++];
            const px = p % width;
            const py = Math.floor(p / width);
            const idx = p * 4;

            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            if (a === 0) continue;

            const dist = colorDist(r, g, b);

            if (dist <= tolDist) {
              if (feather && dist > coreDist) {
                // Smooth anti-aliased edge
                const factor = (dist - coreDist) / (tolDist - coreDist);
                data[idx + 3] = Math.round(a * factor);
              } else {
                data[idx + 3] = 0;
              }

              // Enqueue 4-connected neighbors
              if (px > 0) {
                const n = p - 1;
                if (!visited[n]) {
                  visited[n] = 1;
                  queue[tail++] = n;
                }
              }
              if (px < width - 1) {
                const n = p + 1;
                if (!visited[n]) {
                  visited[n] = 1;
                  queue[tail++] = n;
                }
              }
              if (py > 0) {
                const n = p - width;
                if (!visited[n]) {
                  visited[n] = 1;
                  queue[tail++] = n;
                }
              }
              if (py < height - 1) {
                const n = p + width;
                if (!visited[n]) {
                  visited[n] = 1;
                  queue[tail++] = n;
                }
              }
            }
          }
        } else {
          // Global removal mode (removes matching color anywhere in image)
          for (let i = 0; i < totalPixels; i++) {
            const idx = i * 4;
            const a = data[idx + 3];
            if (a === 0) continue;

            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const dist = colorDist(r, g, b);

            if (dist <= tolDist) {
              if (feather && dist > coreDist) {
                const factor = (dist - coreDist) / (tolDist - coreDist);
                data[idx + 3] = Math.round(a * factor);
              } else {
                data[idx + 3] = 0;
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const resultUrl = canvas.toDataURL('image/png');
        resolve(resultUrl);
      } catch (err) {
        console.warn('Background removal error:', err);
        resolve(imageSrc);
      }
    };

    img.onerror = (err) => {
      console.warn('Image load error during bg removal:', err);
      resolve(imageSrc);
    };

    img.src = imageSrc;
  });
};
