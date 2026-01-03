const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

document.querySelector('.uploadPreviewPanel').addEventListener('click', function() {
    fileInput.click();
});