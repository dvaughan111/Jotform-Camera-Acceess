console.log('Camera Widget Loading...');

let currentStream = null;
let uploadedPhotos = [];

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'du0puu5mt';
const CLOUDINARY_UPLOAD_PRESET = 'jotform_widget_upload';

// JotForm Widget Integration
(function() {
    function waitForJotForm() {
        if (typeof JFCustomWidget !== 'undefined') {
            console.log('JotForm Widget API available');
            JFCustomWidget.subscribe('ready', initCameraWidget);
            
            // Subscribes to the parent form's submit event.
            JFCustomWidget.subscribe('submit', function() {
                console.log('JotForm parent form is submitting. Finalizing widget data...');
                const photoUrls = uploadedPhotos.map(photo => photo.imageUrl).join('|||');

                return {
                    value: photoUrls,
                    valid: true
                };
            });

            // Handles populating the widget with previous data if the form is edited.
            JFCustomWidget.subscribe('populate', function() {
                console.log('Populate event');
                if (uploadedPhotos.length > 0) {
                    return uploadedPhotos.map(photo => photo.imageUrl).join('|||');
                }
                return '';
            });
        } else {
            setTimeout(waitForJotForm, 50);
        }
    }
    waitForJotForm();
})();

function initCameraWidget() {
    console.log('Initializing camera widget...');
    document.getElementById('start-btn').addEventListener('click', startCamera);
    document.getElementById('capture-btn').addEventListener('click', capturePhoto);
    document.getElementById('cancel-btn').addEventListener('click', cancelCamera);
    document.getElementById('approve-btn').addEventListener('click', approvePhoto);
    document.getElementById('retake-btn').addEventListener('click', retakePhoto);
    document.getElementById('add-more-btn').addEventListener('click', addMorePhotos);
    // The 'done-btn' is not needed for form submission, as the JotForm API handles it.
    console.log('Camera widget initialized successfully');
}

function showState(state) {
    const states = ['initial', 'camera', 'preview', 'gallery'];
    states.forEach(s => {
        const el = document.getElementById(s + '-state');
        if (el) el.style.display = 'none';
    });
    const currentState = document.getElementById(state + '-state');
    if (currentState) {
        currentState.style.display = 'flex';
    }
    if (state === 'gallery') {
        updateGallery();
    }
    updateHeight(state);
}

function updateHeight(state) {
    const heights = {
        initial: 150,
        camera: 400,
        preview: 400,
        gallery: 300 + (uploadedPhotos.length * 180)
    };
    try {
        if (typeof JFCustomWidget !== 'undefined' && JFCustomWidget.requestFrameResize) {
            JFCustomWidget.requestFrameResize(heights[state] || 150);
        }
    } catch (e) {
        console.log('Height error:', e);
    }
}

async function startCamera() {
    try {
        showState('camera');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        currentStream = stream;
        const video = document.getElementById('video');
        video.srcObject = stream;
        setTimeout(() => {
            video.play().catch(console.log);
        }, 100);
    } catch (error) {
        alert('Camera failed: ' + error.message);
        showState('initial');
    }
}

function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
        currentStream = null;
    }
}

function capturePhoto() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    if (video && canvas && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        stopCamera();
        showState('preview');
    }
}

function cancelCamera() {
    stopCamera();
    showState('initial');
}

function retakePhoto() {
    showState('camera');
    startCamera();
}

async function approvePhoto() {
    const canvas = document.getElementById('canvas');
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Upload to Cloudinary
    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: JSON.stringify({
                file: dataUrl,
                upload_preset: CLOUDINARY_UPLOAD_PRESET
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        const imageUrl = data.secure_url;
        
        if (!response.ok || !imageUrl) {
            throw new Error(`Cloudinary upload failed: ${data.error ? data.error.message : 'Unknown error'}`);
        }
        
        uploadedPhotos.push({
            dataUrl: dataUrl,
            imageUrl: imageUrl,
            timestamp: Date.now()
        });
        
        console.log('Photo uploaded, URL:', imageUrl);
        sendDataToJotForm();
        showState('gallery');
        
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        alert('Failed to upload photo. Please check your Cloudinary configuration.');
    }
}

function updateGallery() {
    const list = document.getElementById('photos-list');
    if (list) {
        list.innerHTML = '';
        if (uploadedPhotos.length === 0) {
            list.innerHTML = '<div class="empty-state">No photos uploaded yet</div>';
            return;
        }
        uploadedPhotos.forEach((photo, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            const img = document.createElement('img');
            img.src = photo.dataUrl;
            img.className = 'photo-thumbnail';
            img.alt = `Uploaded photo ${index + 1}`;
            img.addEventListener('click', () => viewPhoto(photo.dataUrl));
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'photo-delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deletePhoto(index);
            });
            photoItem.appendChild(img);
            photoItem.appendChild(deleteBtn);
            list.appendChild(photoItem);
        });
    }
}

function viewPhoto(url) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <img src="${url}" class="modal-image" alt="Full size photo">
            <button class="modal-close">×</button>
        </div>
    `;
    modal.querySelector('.modal-close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    document.body.appendChild(modal);
}

function deletePhoto(index) {
    if (confirm('Are you sure you want to delete this photo?')) {
        uploadedPhotos.splice(index, 1);
        updateGallery();
        sendDataToJotForm();
    }
}

function addMorePhotos() {
    showState('initial');
}

function finish() {
    if (typeof JFCustomWidget !== 'undefined') {
        try {
            JFCustomWidget.sendSubmit();
            console.log('JotForm submission completed');
        } catch (e) {
            console.error('Error completing JotForm submission:', e);
        }
    }
    alert(`Upload completed with ${uploadedPhotos.length} photos! The form can now be submitted.`);
}

function sendDataToJotForm() {
    try {
        if (typeof JFCustomWidget !== 'undefined' && JFCustomWidget.sendData) {
            const photoUrls = uploadedPhotos.map(photo => photo.imageUrl).join('|||');
            JFCustomWidget.sendData({
                value: photoUrls,
                valid: true
            });
            console.log('Data sent to JotForm:', photoUrls);
        }
    } catch (e) {
        console.error('Send error:', e);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded');
    if (typeof JFCustomWidget === 'undefined') {
        console.log('JotForm not detected, initializing directly');
        initCameraWidget();
    }
});
