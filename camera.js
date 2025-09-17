console.log('Camera Widget Loading...');

let currentStream = null;
let uploadedPhotos = [];
let isSubmitting = false;

// Initialize the widget
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
    
    console.log('Camera widget initialized successfully');
}

// Show a specific state
function showState(stateId) {
    const states = ['initial-state', 'camera-state', 'preview-state', 'uploading-state', 'gallery-state'];
    states.forEach(state => {
        document.getElementById(state).style.display = 'none';
    });
    document.getElementById(stateId).style.display = 'flex';
    console.log(`Showing state: ${stateId}`);
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
        videoElement.srcObject = stream;
        
        // Wait for video to be ready
        videoElement.onloadedmetadata = function() {
            showState('camera-state');
            console.log('Camera access successful');
        };
        
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
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Stop the camera stream
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }

    showState('preview-state');
    console.log('Photo captured');
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
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    // Show uploading state
    showState('uploading-state');
    
    // Cloudinary credentials
    const CLOUDINARY_CLOUD_NAME = 'du0puu5mt'; 
    const UPLOAD_PRESET = 'jotform_widget_upload'; 

    // Convert data URL to blob
    const blob = dataURLToBlob(dataUrl);
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

    try {
        // Upload the image to Cloudinary
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Cloudinary upload failed');
        }

        const result = await response.json();
        const imageUrl = result.secure_url; 

        // Store the public URL from Cloudinary
        uploadedPhotos.push({
            url: imageUrl,
            timestamp: Date.now(),
            public_id: result.public_id,
            dataUrl: dataUrl // Store data URL for preview
        });

        console.log('Photo uploaded to Cloudinary:', imageUrl);
        sendDataToJotForm();
        showState('gallery-state');

    } catch (error) {
        console.error('Upload Error:', error);
        alert('Failed to upload photo. Please try again.');
        showState('preview-state');
    }
}

// Update the gallery with uploaded photos
function updateGallery() {
    const photosList = document.getElementById('photos-list');
    const photoCount = document.getElementById('photo-count');
    
    photosList.innerHTML = '';
    photoCount.textContent = uploadedPhotos.length;
    
    if (uploadedPhotos.length === 0) {
        photosList.innerHTML = '<div class="empty-state">No photos uploaded yet</div>';
        return;
    }
    
    uploadedPhotos.forEach((photo, index) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        
        const img = document.createElement('img');
        img.src = photo.dataUrl || photo.url;
        img.className = 'photo-thumbnail';
        img.alt = `Uploaded photo ${index + 1}`;
        
        // Make image clickable to view larger version
        img.addEventListener('click', () => viewPhoto(photo.url));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'photo-delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deletePhoto(index);
        });
        
        photoItem.appendChild(img);
        photoItem.appendChild(deleteBtn);
        photosList.appendChild(photoItem);
    });
    
    console.log(`Gallery updated with ${uploadedPhotos.length} photos`);
}

// View photo in modal
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

// Delete a photo
function deletePhoto(index) {
    if (confirm('Are you sure you want to delete this photo?')) {
        uploadedPhotos.splice(index, 1);
        updateGallery();
        sendDataToJotForm();
    }
}

// Add more photos
function addMorePhotos() {
    showState('initial-state');
    console.log('Ready to add more photos');
}

// Finish and submit to JotForm
function finish() {
    if (isSubmitting) return;
    
    isSubmitting = true;
    console.log(`Submitting ${uploadedPhotos.length} photos to JotForm`);
    
    // Send final data to JotForm
    sendDataToJotForm();
    
    // Simulate form submission completion
    setTimeout(() => {
        isSubmitting = false;
        alert(`Form submitted successfully with ${uploadedPhotos.length} photos!`);
        console.log('Form submission completed');
    }, 1000);
}

// Send data to JotForm
function sendDataToJotForm() {
    if (typeof JFCustomWidget !== 'undefined') {
        const urls = uploadedPhotos.map(photo => photo.url);
        const value = urls.length > 0 ? JSON.stringify(urls) : '';
        
        JFCustomWidget.sendData({
            value: value,
            valid: true
        });
        
        console.log('Data sent to JotForm:', value);
    }
    updateGallery();
}

// JotForm Widget Integration
(function() {
    // Wait for JotForm Widget API
    function waitForJotForm() {
        if (typeof JFCustomWidget !== 'undefined') {
            console.log('JotForm Widget API available');
            
            // Subscribe to ready event
            JFCustomWidget.subscribe('ready', function() {
                console.log('Widget ready');
                initCameraWidget();
                
                // Send initial empty data
                JFCustomWidget.sendData({
                    value: '',
                    valid: true
                });
            });
            
            // Handle submit polling - FIXED: Return proper object
            JFCustomWidget.subscribe('submit', function() {
                console.log('Submit event - photos:', uploadedPhotos.length);
                
                const urls = uploadedPhotos.map(photo => photo.url);
                const value = urls.length > 0 ? JSON.stringify(urls) : '';

                // Return proper object structure
                return {
                    value: value,
                    valid: true
                };
            });
            
            // Handle the polling requests we see in Network tab
            JFCustomWidget.subscribe('populate', function() {
                console.log('Populate event');
                const urls = uploadedPhotos.map(photo => photo.url);
                return urls.length > 0 ? JSON.stringify(urls) : '';
            });
            
        } else {
            setTimeout(waitForJotForm, 50);
        }
    }
    
    waitForJotForm();
})();

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded');
    // If JotForm widget API is not available, initialize directly
    if (typeof JFCustomWidget === 'undefined') {
        console.log('JotForm not detected, initializing directly');
        initCameraWidget();
    }
});
