
import { ColorMap } from '../types';

/**
 * Extracts unique fill and stroke colors from an SVG string.
 */
export const extractUniqueColors = (svgString: string): string[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const colors = new Set<string>();

  const elements = doc.querySelectorAll('*');
  elements.forEach((el) => {
    // Check attributes
    ['fill', 'stroke'].forEach(attr => {
      const val = el.getAttribute(attr);
      if (val && val !== 'none' && !val.startsWith('url(') && !val.startsWith('var(')) {
        colors.add(normalizeColor(val));
      }
    });

    // Check inline styles
    const style = el.getAttribute('style');
    if (style) {
      const fillMatch = style.match(/fill:\s*([^;]+)/i);
      const strokeMatch = style.match(/stroke:\s*([^;]+)/i);
      if (fillMatch && fillMatch[1].trim() !== 'none' && !fillMatch[1].includes('url(')) {
        colors.add(normalizeColor(fillMatch[1]));
      }
      if (strokeMatch && strokeMatch[1].trim() !== 'none' && !strokeMatch[1].includes('url(')) {
        colors.add(normalizeColor(strokeMatch[1]));
      }
    }
  });

  return Array.from(colors);
};

const normalizeColor = (color: string): string => {
  const trimmed = color.trim().toLowerCase();
  // Convert basic names to hex if needed or just keep as is if valid color
  return trimmed;
};

/**
 * Replaces colors in the SVG string based on a mapping.
 */
export const applyColorMap = (svgString: string, colorMap: ColorMap): string => {
  let modified = svgString;
  
  // Sort original colors by length descending to prevent partial replacement issues
  const sortedOriginals = Object.keys(colorMap).sort((a, b) => b.length - a.length);

  sortedOriginals.forEach((original) => {
    const replacement = colorMap[original];
    if (original === replacement) return;

    // Escaping special characters for Regex
    const escaped = original.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    // Look for the color specifically in common SVG patterns
    const regex = new RegExp(`(["':\\s])${escaped}(["';\\s]|$)`, 'gi');
    modified = modified.replace(regex, `$1${replacement}$2`);
  });

  return modified;
};

/**
 * Gets the dimensions of the SVG.
 */
export const getSVGDimensions = (svgString: string): { width: number; height: number } => {
  const parser = new DOMParser();
  // Fix Error: Argument of type '"image/xml+html"' is not assignable to parameter of type 'DOMParserSupportedType'.
  // Use 'image/svg+xml' which is the standard MIME type for SVG in DOMParser.
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.querySelector('svg');

  if (!svg) return { width: 500, height: 500 };

  let width = parseFloat(svg.getAttribute('width') || '0');
  let height = parseFloat(svg.getAttribute('height') || '0');
  const viewBoxAttr = svg.getAttribute('viewBox');

  if ((!width || !height) && viewBoxAttr) {
    const parts = viewBoxAttr.split(/\s+|,/);
    if (parts.length === 4) {
      width = width || parseFloat(parts[2]);
      height = height || parseFloat(parts[3]);
    }
  }

  // Fallback if still 0
  return { 
    width: width || 800, 
    height: height || 800 
  };
};
