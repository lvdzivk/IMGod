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

// Opens a file uploading window
document.querySelector('.uploadPreviewPanel').addEventListener('click', function() {
    fileInput.click();
});

fileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

        currentFile = file;

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
            document.querySelector('.metadataList').innerHTML = '';

            currentMeta - meta;

            //loop for checking all information and returing them
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
});

document.getElementById('wipeButtom').addEventListener('click', function() {
    if (!currentFile) {
        alert('Upload image first!')
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
            currentCleanBlob - blob;
        }, 'image/jpeg', 0.95); // Quality 95%
    };

    img.src = URL.createObjectURL(currentFile);
});

