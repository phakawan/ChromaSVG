
/**
 * ChromaSVG - Vanilla JS Core
 */

// --- State Management ---
const state = {
    originalSvg: '',
    currentSvg: '',
    dimensions: { width: 0, height: 0 },
    colorMap: {} as Record<string, string>,
    originalColors: [] as string[]
};

// --- DOM Elements ---
const el = {
    dropZone: document.getElementById('drop-zone') as HTMLDivElement,
    fileInput: document.getElementById('file-input') as HTMLInputElement,
    btnBrowse: document.getElementById('btn-browse') as HTMLButtonElement,
    workspace: document.getElementById('workspace') as HTMLDivElement,
    previewContainer: document.getElementById('preview-container') as HTMLDivElement,
    svgOutput: document.getElementById('svg-output') as HTMLDivElement,
    sidebar: document.getElementById('sidebar') as HTMLDivElement,
    headerActions: document.getElementById('header-actions') as HTMLDivElement,
    colorList: document.getElementById('color-list') as HTMLDivElement,
    btnReset: document.getElementById('btn-reset') as HTMLButtonElement,
    checkerboard: document.getElementById('checkerboard') as HTMLDivElement,
    exportSvg: document.getElementById('export-svg') as HTMLButtonElement,
    exportPng: document.getElementById('export-png') as HTMLButtonElement,
    exportJpeg: document.getElementById('export-jpeg') as HTMLButtonElement,
    canvas: document.getElementById('export-canvas') as HTMLCanvasElement,
    currentYear: document.getElementById('current-year') as HTMLSpanElement
};

// Update footer year dynamically
if (el.currentYear) {
    el.currentYear.textContent = new Date().getFullYear().toString();
}

// --- Utils ---
const extractColors = (svgString: string): string[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const colors = new Set<string>();
    doc.querySelectorAll('*').forEach(el => {
        ['fill', 'stroke'].forEach(attr => {
            const val = el.getAttribute(attr);
            if (val && val !== 'none' && !val.startsWith('url(')) colors.add(val.toLowerCase());
        });
        const style = el.getAttribute('style');
        if (style) {
            const matches = style.match(/(fill|stroke):\s*([^;]+)/gi);
            matches?.forEach(m => {
                const color = m.split(':')[1].trim().toLowerCase();
                if (color !== 'none' && !color.startsWith('url(')) colors.add(color);
            });
        }
    });
    return Array.from(colors);
};

const getDimensions = (svgString: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) return { width: 800, height: 800 };
    let w = parseFloat(svg.getAttribute('width') || '0');
    let h = parseFloat(svg.getAttribute('height') || '0');
    const viewBox = svg.getAttribute('viewBox');
    if ((!w || !h) && viewBox) {
        const parts = viewBox.split(/\s+|,/);
        if (parts.length === 4) { w = parseFloat(parts[2]); h = parseFloat(parts[3]); }
    }
    return { width: w || 800, height: h || 800 };
};

const applyColors = () => {
    let modified = state.originalSvg;
    const sorted = Object.keys(state.colorMap).sort((a, b) => b.length - a.length);
    sorted.forEach(oldColor => {
        const newColor = state.colorMap[oldColor];
        if (oldColor === newColor) return;
        const escaped = oldColor.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(["':\\s])${escaped}(["';\\s]|$)`, 'gi');
        modified = modified.replace(regex, `$1${newColor}$2`);
    });
    state.currentSvg = modified;
    el.svgOutput.innerHTML = modified;
};

// --- Core Actions ---
const handleFile = (file: File) => {
    if (!file || !file.name.endsWith('.svg')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        state.originalSvg = content;
        state.originalColors = extractColors(content);
        state.dimensions = getDimensions(content);
        state.colorMap = {};
        state.originalColors.forEach(c => state.colorMap[c] = c);
        
        renderUI();
    };
    reader.readAsText(file);
};

const renderUI = () => {
    el.dropZone.classList.add('hidden');
    el.previewContainer.classList.remove('hidden');
    el.sidebar.classList.remove('hidden');
    el.headerActions.classList.remove('hidden');
    
    // Set aspect ratio
    const ratio = state.dimensions.width / state.dimensions.height;
    el.checkerboard.style.aspectRatio = ratio.toString();
    
    // Color List
    el.colorList.innerHTML = '';
    state.originalColors.forEach((color, i) => {
        const card = document.createElement('div');
        card.className = "flex items-center space-x-4 p-3 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow";
        card.innerHTML = `
            <div class="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shadow-inner">
                <input type="color" data-color="${color}" value="${color.startsWith('#') ? color : '#000000'}" 
                    class="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer border-none p-0 outline-none">
            </div>
            <div class="flex flex-col flex-1 overflow-hidden">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Layer ${i+1}</span>
                <span class="text-xs font-mono font-medium text-gray-700 truncate">${color}</span>
            </div>
        `;
        const input = card.querySelector('input') as HTMLInputElement;
        input.oninput = (e) => {
            state.colorMap[color] = (e.target as HTMLInputElement).value;
            applyColors();
            card.querySelector('.font-mono')!.textContent = state.colorMap[color];
        };
        el.colorList.appendChild(card);
    });

    applyColors();
};

const download = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
};

const exportImage = (format: 'png' | 'jpeg') => {
    const ctx = el.canvas.getContext('2d')!;
    const img = new Image();
    const svg64 = btoa(unescape(encodeURIComponent(state.currentSvg)));
    img.onload = () => {
        el.canvas.width = state.dimensions.width;
        el.canvas.height = state.dimensions.height;
        if (format === 'jpeg') {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, el.canvas.width, el.canvas.height);
        } else {
            ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        download(el.canvas.toDataURL(`image/${format}`, 0.95), `chromasvg-${Date.now()}.${format}`);
    };
    img.src = `data:image/svg+xml;base64,${svg64}`;
};

// --- Listeners ---
el.btnBrowse.onclick = () => el.fileInput.click();
el.fileInput.onchange = (e) => handleFile((e.target as HTMLInputElement).files![0]);

el.dropZone.ondragover = (e) => { e.preventDefault(); el.dropZone.classList.add('dragging'); };
el.dropZone.ondragleave = () => el.dropZone.classList.remove('dragging');
el.dropZone.ondrop = (e) => {
    e.preventDefault();
    el.dropZone.classList.remove('dragging');
    handleFile(e.dataTransfer!.files[0]);
};

el.btnReset.onclick = () => {
    state.originalSvg = '';
    el.dropZone.classList.remove('hidden');
    el.previewContainer.classList.add('hidden');
    el.sidebar.classList.add('hidden');
    el.headerActions.classList.add('hidden');
    el.fileInput.value = '';
};

el.exportSvg.onclick = () => {
    const blob = new Blob([state.currentSvg], { type: 'image/svg+xml' });
    download(URL.createObjectURL(blob), `chromasvg-${Date.now()}.svg`);
};
el.exportPng.onclick = () => exportImage('png');
el.exportJpeg.onclick = () => exportImage('jpeg');

console.log("ChromaSVG initialized - Simplified Mode");
