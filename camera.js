console.log('Camera Widget Loading...');

let currentStream = null;
let uploadedPhotos = [];
let isSubmitting = false;
let widgetReady = false;

// Initialize the widget and subscribe to JotForm events
function initCameraWidget() {
    console.log('Initializing camera widget...');
    
    // Set up event listeners
    document.getElementById('start-btn').addEventListener('click', startCamera);
    document.getElementById('capture-btn').addEventListener('click', capturePhoto);
    document.getElementById('cancel-btn').addEventListener('click', cancelCamera);
    document.getElementById('approve-btn').addEventListener('click', approvePhoto);
    document.getElementById('retake-btn').addEventListener('click', retakePhoto);
    document.getElementById('add-more-btn').addEventListener('click', addMorePhotos);
    document.getElementById('done-btn').addEventListener('click', finish);
    
    // Initialize JotForm Widget API
    initJotFormAPI();
    
    console.log('Camera widget initialized successfully');
}

// Initialize JotForm Widget API
function initJotFormAPI() {
    if (typeof JFCustomWidget !== 'undefined') {
        console.log('JotForm Widget API found, subscribing to events...');
        
        // Subscribe to ready event
        JFCustomWidget.subscribe('ready', function(formObject) {
            console.log('Widget ready event received:', formObject);
            widgetReady = true;
        });
        
        // Subscribe to submit event
        JFCustomWidget.subscribe('submit', function(formObject) {
            console.log('Submit event received:', formObject);
            // This is where we send our data when the form is being submitted
            const photoUrls = uploadedPhotos.map(photo => photo.url);
            const dataToSend = photoUrls.length > 0 ? photoUrls.join(',') : '';
            console.log('Sending data to JotForm:', dataToSend);
            JFCustomWidget.sendData(dataToSend);
        });
        
    } else {
        console.warn('JotForm Widget API not available');
        // Retry after a short delay
        setTimeout(initJotFormAPI, 500);
    }
}

// Show a specific state
function showState(stateId) {
    const states = ['initial-state', 'camera-state', 'preview-state', 'uploading-state', 'gallery-state'];
    states.forEach(state => {
        const element = document.getElementById(state);
        if (element) {
            element.style.display = 'none';
        }
    });
    
    const currentState = document.getElementById(stateId);
    if (currentState) {
        currentState.style.display = 'flex';
        console.log(`Showing state: ${stateId}`);
    }
}

// Start the camera
async function startCamera() {
    try {
        console.log('Attempting to access camera...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false 
        });
        
        currentStream = stream;
        const videoElement = document.getElementById('video');
        if (videoElement) {
            videoElement.srcObject = stream;
            
            const playPromise = videoElement.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Auto-play was prevented:', error);
                    videoElement.controls = true;
                });
            }
        }
        
        showState('camera-state');
        console.log('Camera access successful');
        
    } catch (error) {
        console.error(`Camera error: ${error.message}`);
        alert(`Cannot access camera: ${error.message}`);
        showState('initial-state');
    }
}

// Capture a photo
function capturePhoto() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    
    if (video && canvas) {
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }

        showState('preview-state');
        console.log('Photo captured');
    }
}

// Cancel camera operation
function cancelCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    showState('initial-state');
    console.log('Camera operation cancelled');
}

// Retake photo
function retakePhoto() {
    showState('camera-state');
    startCamera();
    console.log('Retaking photo');
}

// Helper function to convert data URL to blob
function dataURLToBlob(dataUrl) {
    const parts = dataUrl.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    
    for (let i = 0; i < raw.length; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
}

// Approve and upload the photo to Cloudinary
async function approvePhoto() {
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        alert('Canvas element not found');
        return;
    }
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    showState('uploading-state');
    
    try {
        const CLOUDINARY_CLOUD_NAME = 'du0puu5mt'; 
        const UPLOAD_PRESET = 'jotform_widget_upload'; 

        const blob = dataURLToBlob(dataUrl);
        const formData = new FormData();
        formData.append('file', blob);
        formData.append('upload_preset', UPLOAD_PRESET);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Upload successful:', result);

        const photoData = {
            id: result.public_id,
            url: result.secure_url,
            thumbnail: result.secure_url.replace('/upload/', '/upload/w_150,h_150,c_fill/'),
            timestamp: new Date().toISOString()
        };

        uploadedPhotos.push(photoData);
        
        // Immediately send updated data to JotForm
        sendDataToJotForm();
        
        updatePhotoGallery();
        showState('gallery-state');
        
    } catch (error) {
        console.error('Upload error:', error);
        alert(`Upload failed: ${error.message}`);
        showState('preview-state');
    }
}

// Send data to JotForm immediately when photos are uploaded
function sendDataToJotForm() {
    if (typeof JFCustomWidget !== 'undefined' && widgetReady) {
        const photoUrls = uploadedPhotos.map(photo => photo.url);
        const dataToSend = photoUrls.join(',');
        console.log('Sending updated data to JotForm:', dataToSend);
        JFCustomWidget.sendData(dataToSend);
    } else {
        console.log('JotForm API not ready yet');
    }
}

// Update the photo gallery display
function updatePhotoGallery() {
    const photosList = document.getElementById('photos-list');
    const photoCount = document.getElementById('photo-count');
    
    if (!photosList || !photoCount) return;
    
    photoCount.textContent = uploadedPhotos.length;
    photosList.innerHTML = '';
    
    if (uploadedPhotos.length === 0) {
        photosList.innerHTML = '<div class="empty-state">No photos uploaded yet</div>';
        return;
    }
    
    uploadedPhotos.forEach((photo, index) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `
            <img src="${photo.thumbnail}" alt="Photo ${index + 1}" class="photo-thumbnail">
            <button class="photo-delete-btn" onclick="deletePhoto(${index})" title="Delete photo">×</button>
        `;
        
        photoItem.querySelector('.photo-thumbnail').addEventListener('click', () => {
            showFullSizePhoto(photo.url);
        });
        
        photosList.appendChild(photoItem);
    });
}

// Delete a photo from the gallery
function deletePhoto(index) {
    if (confirm('Are you sure you want to delete this photo?')) {
        uploadedPhotos.splice(index, 1);
        sendDataToJotForm(); // Update JotForm with new data
        updatePhotoGallery();
        console.log(`Photo ${index} deleted`);
    }
}

// Show full-size photo in modal
function showFullSizePhoto(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <img src="${imageUrl}" alt="Full size photo" class="modal-image">
            <button class="modal-close">×</button>
        </div>
    `;
    
    const closeModal = () => {
        document.body.removeChild(modal);
    };
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    document.body.appendChild(modal);
}

// Add more photos
function addMorePhotos() {
    showState('initial-state');
    console.log('Adding more photos');
}

// Finish - just show completion message
function finish() {
    if (uploadedPhotos.length === 0) {
        alert('Please upload at least one photo before finishing.');
        return;
    }
    
    // Send final data to JotForm
    sendDataToJotForm();
    
    alert(`Upload complete! ${uploadedPhotos.length} photo(s) ready for form submission.`);
    console.log('Widget finished, data sent to JotForm');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initJotFormAPI);

// Initialize widget when page loads
window.addEventListener('load', initCameraWidget);
