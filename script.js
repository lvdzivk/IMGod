
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

    console.log('Selected image: ', file.name);

    // file reading
    const reader = new FileReader();

    reader.onload = function(e) {
        const buffer = e.target.result;
        console.log('Bytes:', buffer.byteLength);

        // exifr functions - check tiff, iptc and xmp and returns inside HTML
        exifr.parse(buffer, {
            tiff: true,
            iptc: true,
            xmp: true
        }).then(function(meta) {
            document.querySelector('.metadataList').innerHTML = '';

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