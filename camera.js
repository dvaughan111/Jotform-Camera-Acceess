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
            
            // Use a promise to handle video play with user interaction
            const playPromise = videoElement.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Auto-play was prevented:', error);
                    // Show play button instead
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

    // Show uploading state
    showState('uploading-state');
    
    try {
        // Cloudinary credentials
        const CLOUDINARY_CLOUD_NAME = 'du0puu5mt'; 
        const UPLOAD_PRESET = 'jotform_widget_upload'; 

        // Convert data URL to blob
        const blob = dataURLToBlob(dataUrl);
        
        // Create form data for Cloudinary upload
        const formData = new FormData();
        formData.append('file', blob);
        formData.append('upload_preset', UPLOAD_PRESET);

        // Upload to Cloudinary
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Upload successful:', result);

        // Store the uploaded photo data
        const photoData = {
            id: result.public_id,
            url: result.secure_url,
            thumbnail: result.secure_url.replace('/upload/', '/upload/w_150,h_150,c_fill/'),
            timestamp: new Date().toISOString()
        };

        uploadedPhotos.push(photoData);
        updatePhotoGallery();
        showState('gallery-state');
        
    } catch (error) {
        console.error('Upload error:', error);
        alert(`Upload failed: ${error.message}`);
        showState('preview-state'); // Go back to preview state on error
    }
}

// Update the photo gallery display
function updatePhotoGallery() {
    const photosList = document.getElementById('photos-list');
    const photoCount = document.getElementById('photo-count');
    
    if (!photosList || !photoCount) return;
    
    // Update photo count
    photoCount.textContent = uploadedPhotos.length;
    
    // Clear existing photos
    photosList.innerHTML = '';
    
    if (uploadedPhotos.length === 0) {
        photosList.innerHTML = '<div class="empty-state">No photos uploaded yet</div>';
        return;
    }
    
    // Add each photo
    uploadedPhotos.forEach((photo, index) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `
            <img src="${photo.thumbnail}" alt="Photo ${index + 1}" class="photo-thumbnail">
            <button class="photo-delete-btn" onclick="deletePhoto(${index})" title="Delete photo">×</button>
        `;
        
        // Add click handler for full-size view
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
    
    // Close modal handlers
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

// Finish and submit to JotForm
function finish() {
    if (isSubmitting) return;
    
    if (uploadedPhotos.length === 0) {
        alert('Please upload at least one photo before finishing.');
        return;
    }
    
    isSubmitting = true;
    
    try {
        // Prepare data for JotForm
        const photoUrls = uploadedPhotos.map(photo => photo.url);
        const submissionData = {
            photos: photoUrls,
            photoCount: uploadedPhotos.length,
            uploadedAt: new Date().toISOString()
        };
        
        console.log('Submitting to JotForm:', submissionData);
        
        // Submit to JotForm using the widget API
        if (typeof JFCustomWidget !== 'undefined') {
            JFCustomWidget.sendSubmit(submissionData);
        } else {
            console.warn('JotForm Widget API not available, logging data instead');
            console.log('Would submit:', submissionData);
            alert(`Upload complete! ${uploadedPhotos.length} photo(s) uploaded successfully.`);
        }
        
    } catch (error) {
        console.error('Submission error:', error);
        alert('There was an error submitting your photos. Please try again.');
    } finally {
        isSubmitting = false;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initCameraWidget);

// Initialize when page loads (fallback)
window.addEventListener('load', () => {
    if (document.readyState === 'complete') {
        initCameraWidget();
    }
});
