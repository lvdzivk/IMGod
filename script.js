let currentFile = null;
let currentBuffer = null;
let currentMeta = null;
let currentCleanBlob = null;

// Creates invisible <input type="file">
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

// Drag & drop file 
const previewPanel = document.querySelector('.uploadPreviewPanel');

// Highlight feedback
function highlight() {
  previewPanel.classList.add('dragover');
}
function unhighlight() {
  previewPanel.classList.remove('dragover');
}

// Upload number limit
const MAX_FILES = 1;

// Drop 
['dragenter', 'dragover'].forEach(eventName => {
    previewPanel.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        highlight();
    });
});

['dragleave', 'drop'].forEach(eventName => {
    previewPanel.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        unhighlight();
    });
});

// Handle drop
previewPanel.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (!files || !files.length) return;

    if (files.length > MAX_FILES) {
        alert(`Only ${MAX_FILES} file(s) allowed! (got ${files.length})`);
        return;
    }

    const file = files[0];
    // Filter only image type of file
    if (!file.type.startsWith('image/')) {
        alert('Only image files allowed!');
        return;
    }

    // Reuse flow 
    handleFile(file);
});


// File uploading window
document.querySelector('.uploadPreviewPanel').addEventListener('click', function() {
    fileInput.click();
});

// Reading metadata logic
fileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    handleFile(file);
});

function handleFile(file) {
        currentFile = file;

        // clean uploadPreviewPanel previous content
        const previewPanel = document.querySelector('.uploadPreviewPanel');
        previewPanel.innerHTML = '';

        // Create img element for preview
        const previewImg = document.createElement('img');
        previewImg.src = URL.createObjectURL(file);
        previewImg.style.maxWidth = '90%';
        previewImg.style.maxHeight = '90%';
        previewImg.style.objectFit = 'contain';
        previewImg.style.borderRadius = '18px'; // Fit border-radius of cell

        // Add thumbnail to panel
        previewPanel.appendChild(previewImg);

    // file reading
    const reader = new FileReader();

    reader.onload = function(e) {
        const buffer = e.target.result;
        console.log('Bytes:', buffer.byteLength);

        currentBuffer = buffer;

        // exifr functions - check tiff, iptc and xmp and returns inside HTML
        exifr.parse(buffer, {
            tiff: true,
            iptc: true,
            xmp: true
        }).then(function(meta) {
            const metadataList = document.querySelector('.metadataList');
            metadataList.innerHTML = '';

            if (!meta || Object.keys(meta).length === 0) {
                metadataList.innerHTML = '<div style="text-align: center; padding: 20px; font-weight: 500;">This file contains no metadata to show or destroy.</div>';
                currentMeta === null;
                document.getElementById('wipeButton').disabled = true;
                document.getElementById('exportJSON').disabled = true;
                document.getElementById('exportCSV').disabled = true;
                return;
            }

            currentMeta = meta;
            document.getElementById('wipeButton').disabled = false;
            document.getElementById('exportJSON').disabled = false;
            document.getElementById('exportCSV').disabled = false;
            

            // loop for checking all information and returing them
            for (let key in meta) {
                if (meta[key]) {
                    const div = document.createElement('div');
                    div.innerHTML = `<strong>${key}:</strong> ${meta[key]}`;
                    document.querySelector('.metadataList').appendChild(div);
                }
            }

             
        });
    };

    reader.readAsArrayBuffer(file);
}

// Wiping metadata logic
document.getElementById('wipeButton').addEventListener('click', function() {
    if (!currentFile) {
        alert('Upload image first!');
        return;
    }

    // Canvas - creates clean image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function() {
        // Set resolution
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image without meta
        ctx.drawImage(img, 0, 0);

        // Save as new file
        canvas.toBlob(function(blob) {
            console.log('Clean image:', blob.size, 'bytes');
            currentCleanBlob = blob;
            document.querySelector('.metadataList').innerHTML = `<div><strong>Cleaning completed.</strong><br> File Name: ${currentFile.name}<br>New Size: ${currentCleanBlob.size} Bytes</div>`;
        }, 'image/jpeg', 0.95); // Quality 95%
    };

    img.src = URL.createObjectURL(currentFile);
});

// Exporting to JSON
document.getElementById('exportJSON').addEventListener('click', function() {
    if (!currentMeta) {
        alert('Upload and parse image first!');
        return;
    }

    const jsonStr = JSON.stringify(currentMeta, null, 2);
    const jsonBlob = new Blob([jsonStr, { type: 'application/json' }]);

    downloadBlob(jsonBlob, `IMGod-${currentFile.name.replace(/\.[^/.]+$/, "")}-metadata.json`);
});

// Exporting to CSV
document.getElementById('exportCSV').addEventListener('click', function() {
    if (!currentMeta) {
        alert('Upload and parse image first!');
        return;
    }

    // Header row
    const headers = Object.keys(currentMeta);
    let csvContent = headers.join(',') + '\n';

    // Values row (flattens nested objects)
    const values = headers.map(key => {
        const val = currentMeta[key];
        return typeof val === 'object' ? JSON.stringify(val) : val;
    });
    csvContent += values.join(',') + '\n';

    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    downloadBlob(csvBlob, `IMGod-${currentFile.name.replace(/\.[^/.]+$/, "")}-metadata.csv`);

});

// Downloading results
document.getElementById('downloadButton').addEventListener('click', function() {
    if (!currentCleanBlob) {
        alert('First wipe metadata.');
        return;
    }

    downloadBlob(currentCleanBlob, `IMGod-${currentFile.name.replace(/\.[^/.]+$/, "")}`);

});

// Credits modal
document.getElementById('credits').addEventListener('click', function() {
    document.getElementById('modalOverlay').classList.add('active');
});

document.getElementById('closeModal').addEventListener('click', function() {
    document.getElementById('modalOverlay').classList.remove('active');
});

document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.remove('active');
    }
});

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}