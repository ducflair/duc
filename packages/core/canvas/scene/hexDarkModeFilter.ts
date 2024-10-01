function hexToRgb(hex: string): { r: number; g: number; b: number } {
    // Remove the hash symbol if present
    hex = hex.replace(/^#/, '');

    // Parse the hexadecimal values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
    // Convert RGB values back to hexadecimal
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function invertColor(rgb: { r: number; g: number; b: number }, invertPercentage: number): { r: number; g: number; b: number } {
    // Invert the color by a specific percentage
    let invertFactor = invertPercentage / 100;
    let invertedRgb = {
        r: Math.round((255 - rgb.r) * invertFactor + rgb.r * (1 - invertFactor)),
        g: Math.round((255 - rgb.g) * invertFactor + rgb.g * (1 - invertFactor)),
        b: Math.round((255 - rgb.b) * invertFactor + rgb.b * (1 - invertFactor))
    };
    return invertedRgb;
}

function hueRotateColor(rgb: { r: number; g: number; b: number }, degrees: number): { r: number; g: number; b: number } {
    // Convert RGB to HSL
    let r = rgb.r / 255;
    let g = rgb.g / 255;
    let b = rgb.b / 255;

    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    // Rotate hue by the given degree
    h = (h + degrees / 360) % 1;

    // Convert HSL back to RGB
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;

    let newR = Math.round(hueToRgb(p, q, h + 1 / 3) * 255);
    let newG = Math.round(hueToRgb(p, q, h) * 255);
    let newB = Math.round(hueToRgb(p, q, h - 1 / 3) * 255);

    return { r: newR, g: newG, b: newB };
}

function hueToRgb(p: number, q: number, t: number): number {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
}

function transformHexColor(hex: string): string {
    let rgb = hexToRgb(hex);
    let invertedRgb = invertColor(rgb, 93);
    let hueRotatedRgb = hueRotateColor(invertedRgb, 180);
    return rgbToHex(hueRotatedRgb.r, hueRotatedRgb.g, hueRotatedRgb.b);
}

export default transformHexColor