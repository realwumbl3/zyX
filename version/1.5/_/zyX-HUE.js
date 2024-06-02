const CANVAS = document.createElement("canvas");
CANVAS.width = 500;
CANVAS.height = 500;
const NOSATURATION_HUE_DEFAULT = 200;

const CTX = CANVAS.getContext("2d", { willReadFrequently: true });


export default function calculateDominantColor(img_url, crossOriginAnonymous = true) {
	return new Promise((resolve, reject) => {
		const Img = new Image(),
			blockSize = 30; // only visit every x pixels,

		crossOriginAnonymous && (Img.crossOrigin = "Anonymous");

		let data,
			i = -4,
			length,
			rgb = { r: 0, g: 0, b: 0 },
			count = 0;

		Img.src = img_url;

		Img.onload = () => {
			CTX.drawImage(Img, 0, 0, 500, 500);
			if (!CTX) {
				return resolve();
			}
			try {
				data = CTX.getImageData(0, 0, 500, 500);
			} catch (e) {
				console.log("error", e);
				return resolve();
			}
			length = data.data.length;
			while ((i += blockSize * 4) < length) {
				++count;
				rgb.r += data.data[i];
				rgb.g += data.data[i + 1];
				rgb.b += data.data[i + 2];
			}
			Img.remove();
			rgb.r = ~~(rgb.r / count);
			rgb.g = ~~(rgb.g / count);
			rgb.b = ~~(rgb.b / count);
			const r_h = (rgb.r /= 255),
				g_h = (rgb.g /= 255),
				b_h = (rgb.b /= 255),
				cmin = Math.min(r_h, g_h, b_h),
				cmax = Math.max(r_h, g_h, b_h),
				delta = cmax - cmin;
			let h = 0,
				s = 0,
				l = 0;

			if (delta == 0) h = 0;
			else if (cmax == r_h) h = ((g_h - b_h) / delta) % 6;
			else if (cmax == g_h) h = (b_h - r_h) / delta + 2;
			else h = (r_h - g_h) / delta + 4;
			h = Math.round(h * 60);
			if (h < 0) {
				h += 360;
			}
			l = (cmax + cmin) / 2;
			s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
			s = (s * 100).toFixed(1);
			l = (l * 100).toFixed(1);

			if (s < 3) h = NOSATURATION_HUE_DEFAULT;
			resolve({ h, s, l });
		};
	});
}
