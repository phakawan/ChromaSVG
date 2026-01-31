
/**
 * Extracts unique fill and stroke colors from an SVG string.
 */
export const extractUniqueColors = (svgString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const colors = new Set();

  const elements = doc.querySelectorAll('*');
  elements.forEach((el) => {
    // Check attributes
    ['fill', 'stroke'].forEach(attr => {
      const val = el.getAttribute(attr);
      if (val && val !== 'none' && !val.startsWith('url(') && !val.startsWith('var(')) {
        colors.add(val.trim().toLowerCase());
      }
    });

    // Check inline styles
    const style = el.getAttribute('style');
    if (style) {
      const fillMatch = style.match(/fill:\s*([^;]+)/i);
      const strokeMatch = style.match(/stroke:\s*([^;]+)/i);
      if (fillMatch && fillMatch[1].trim() !== 'none' && !fillMatch[1].includes('url(')) {
        colors.add(fillMatch[1].trim().toLowerCase());
      }
      if (strokeMatch && strokeMatch[1].trim() !== 'none' && !strokeMatch[1].includes('url(')) {
        colors.add(strokeMatch[1].trim().toLowerCase());
      }
    }
  });

  return Array.from(colors);
};

/**
 * Replaces colors in the SVG string based on a mapping.
 */
export const applyColorMap = (svgString, colorMap) => {
  let modified = svgString;
  
  const sortedOriginals = Object.keys(colorMap).sort((a, b) => b.length - a.length);

  sortedOriginals.forEach((original) => {
    const replacement = colorMap[original];
    if (original === replacement) return;

    const escaped = original.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(["':\\s])${escaped}(["';\\s]|$)`, 'gi');
    modified = modified.replace(regex, `$1${replacement}$2`);
  });

  return modified;
};

/**
 * Gets the dimensions of the SVG.
 */
export const getSVGDimensions = (svgString) => {
  const parser = new DOMParser();
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

  return { 
    width: width || 800, 
    height: height || 800 
  };
};
