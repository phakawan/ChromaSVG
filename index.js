/**
 * ChromaSVG - Vanilla JS Core
 */

import { extractUniqueColors, applyColorMap, getSVGDimensions } from './utils/svgParser.js';

// --- State Management ---
const state = {
    originalSvg: '',
    currentSvg: '',
    dimensions: { width: 0, height: 0 },
    colorMap: {},
    originalColors: []
};

// --- Utils ---
const hexToRgb = (hex) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '0, 0, 0';
};

// --- DOM Elements ---
const el = {
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    btnBrowse: document.getElementById('btn-browse'),
    workspace: document.getElementById('workspace'),
    previewContainer: document.getElementById('preview-container'),
    svgOutput: document.getElementById('svg-output'),
    sidebar: document.getElementById('sidebar'),
    headerActions: document.getElementById('header-actions'),
    colorList: document.getElementById('color-list'),
    colorCount: document.getElementById('color-count'),
    btnReset: document.getElementById('btn-reset'),
    checkerboard: document.getElementById('checkerboard'),
    exportSvg: document.getElementById('export-svg'),
    exportPng: document.getElementById('export-png'),
    exportJpeg: document.getElementById('export-jpeg'),
    canvas: document.getElementById('export-canvas'),
    infoModal: document.getElementById('info-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    closeModal: document.getElementById('close-modal'),
    currentYear: document.getElementById('current-year')
};

// Update footer year dynamically
if (el.currentYear) {
    el.currentYear.textContent = new Date().getFullYear().toString();
}

// --- Info Content (Static) ---
const infoContent = {
    terms: { title: "Terms of Use", body: `<p class="text-sm">Usage terms for ChromaSVG.</p>` },
    privacy: { title: "Privacy Policy", body: `<p class="text-sm">Privacy policy details.</p>` },
    licensing: { title: "Licensing", body: `<p class="text-sm">Licensing information.</p>` }
};

const showModal = (type) => {
    const content = infoContent[type];
    if (!content) return;
    el.modalTitle.textContent = content.title;
    el.modalBody.innerHTML = content.body;
    el.infoModal.classList.remove('hidden');
    el.infoModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
};

const hideModal = () => {
    el.infoModal.classList.add('hidden');
    el.infoModal.classList.remove('flex');
    document.body.style.overflow = '';
};

const applyColors = () => {
    state.currentSvg = applyColorMap(state.originalSvg, state.colorMap);
    el.svgOutput.innerHTML = state.currentSvg;
};

// --- Core Actions ---
const handleFile = (file) => {
    if (!file || !file.name.endsWith('.svg')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        state.originalSvg = content;
        state.originalColors = extractUniqueColors(content);
        state.dimensions = getSVGDimensions(content);
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
    
    if (el.colorCount) el.colorCount.textContent = state.originalColors.length;
    
    const ratio = state.dimensions.width / state.dimensions.height;
    el.checkerboard.style.aspectRatio = ratio.toString();
    
    el.colorList.innerHTML = '';
    state.originalColors.forEach((color, i) => {
        const card = document.createElement('div');
        const hexValue = color.startsWith('#') ? color : '#000000';
        
        card.className = "flex items-center p-1.5 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer group shadow-sm";
        card.innerHTML = `
            <div class="swatch-wrapper relative w-8 h-8 rounded-full border border-gray-200 shadow-inner shrink-0 overflow-hidden" 
                 style="background-color: ${hexValue};">
                <input type="color" data-color="${color}" value="${hexValue}" 
                    class="absolute inset-0 w-full h-full cursor-pointer opacity-0 scale-150">
            </div>
            <div class="flex-1 ml-2.5 overflow-hidden">
                <div class="flex items-center">
                    <span class="hex-display truncate uppercase text-gray-900" 
                          style="font-size: 12px; font-weight: 700; letter-spacing: 0.24px; line-height: 1.4; display: block;">${color}</span>
                </div>
                <span class="rgb-display block uppercase text-gray-400 truncate" 
                      style="font-size: 12px; font-weight: 500; letter-spacing: 0.24px; line-height: 1.4;">RGB(${hexToRgb(color)})</span>
            </div>
        `;
        
        const input = card.querySelector('input');
        const swatchWrapper = card.querySelector('.swatch-wrapper');
        
        input.oninput = (e) => {
            const newColor = e.target.value.toUpperCase();
            state.colorMap[color] = newColor;
            applyColors();
            
            // Sync background and text
            swatchWrapper.style.backgroundColor = newColor;
            card.querySelector('.hex-display').textContent = newColor;
            card.querySelector('.rgb-display').textContent = `RGB(${hexToRgb(newColor)})`;
        };
        
        el.colorList.appendChild(card);
    });

    applyColors();
};

const download = (url, name) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
};

const exportImage = (format) => {
    const ctx = el.canvas.getContext('2d');
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
el.fileInput.onchange = (e) => handleFile(e.target.files[0]);
el.dropZone.ondragover = (e) => { e.preventDefault(); el.dropZone.classList.add('dragging'); };
el.dropZone.ondragleave = () => el.dropZone.classList.remove('dragging');
el.dropZone.ondrop = (e) => {
    e.preventDefault();
    el.dropZone.classList.remove('dragging');
    handleFile(e.dataTransfer.files[0]);
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

// Modal Listeners
document.querySelectorAll('[data-info]').forEach(btn => {
    btn.onclick = () => showModal(btn.dataset.info);
});
el.closeModal.onclick = hideModal;
el.infoModal.onclick = (e) => { if (e.target === el.infoModal) hideModal(); };
