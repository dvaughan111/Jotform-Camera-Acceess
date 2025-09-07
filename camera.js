console.log('🚀 Camera Widget Loading...');

let currentStream = null;
let uploadedPhotos = [];

function initCameraWidget() {
    console.log('📍 initCameraWidget called');
    
    const container = document.getElementById('camera-widget');
    if (!container) {
        console.error('❌ No camera-widget container found');
        return;
    }
    
    // Create the interface with multiple photo support
    container.innerHTML = `
        <div class="widget-container" style="padding: 20px; text-align: center; background: #f8f9fa; border-radius: 8px; min-height: 100px;">
            <!-- INITIAL STATE -->
            <div id="initial-state" style="display: block;">
                <button id="start-camera-btn" style="
                    background: #007bff; 
                    color: white; 
                    padding: 15px 30px; 
                    border: none; 
                    border-radius: 5px; 
                    font-size: 16px; 
                    cursor: pointer;
                    width: 200px;
                    margin: 10px;
                ">📷 Take Photo</button>
                <p style="margin-top: 10px; color: #666; font-size: 14px;">Click to start camera</p>
            </div>
            
            <!-- CAMERA STATE -->
            <div id="camera-state" style="display: none;">
                <div style="background: #000; width: 100%; height: 300px; margin-bottom: 15px; border-radius: 5px; position: relative;">
                    <video id="camera-video" style="width: 100%; height: 100%; object-fit: cover;" playsinline muted></video>
                </div>
                <button id="capture-btn" style="background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px;">📸 Capture</button>
                <button id="cancel-btn" style="background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px;">✖ Cancel</button>
            </div>
            
            <!-- PREVIEW STATE -->
            <div id="preview-state" style="display: none;">
                <canvas id="photo-canvas" style="max-width: 100%; max-height: 300px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 15px;"></canvas><br>
                <button id="approve-btn" style="background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px;">✓ Approve</button>
                <button id="retake-btn" style="background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px;">↻ Retake</button>
            </div>
            
            <!-- UPLOADING STATE -->
            <div id="uploading-state" style="display: none;">
                <p style="font-size: 16px; color: #007bff;">Uploading photo...</p>
                <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                    <div style="width: 100%; height: 100%; background: #007bff; animation: pulse 1.5s infinite;"></div>
                </div>
            </div>
            
            <!-- THUMBNAIL STATE - UPDATED FOR MULTIPLE PHOTOS -->
            <div id="thumbnail-state" style="display: none;">
                <p style="color: green; font-weight: bold; margin-bottom: 15px; font-size: 16px;">Photo uploaded successfully!</p>
                
                <!-- Action Buttons -->
                <div style="margin: 20px 0; padding: 15px; background: #fff; border-radius: 8px; border: 1px solid #ddd;">
                    <button id="add-another-btn" style="background: #28a745; color: white; padding: 12px 24px; border: none; border-radius: 5px; margin: 8px; cursor: pointer; font-size: 14px;">
                        📷 Add Another Photo
                    </button>
                    <button id="done-btn" style="background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 5px; margin: 8px; cursor: pointer; font-size: 14px;">
                        ✅ Done Uploading
                    </button>
                </div>
                
                <!-- Uploaded Photos Gallery - FIXED VISIBILITY -->
                <div id="uploaded-photos-container" style="margin-top: 25px; padding: 20px; background: #fff; border-radius: 8px; border: 1px solid #ddd; display: block;">
                    <h4 style="margin-bottom: 20px; color: #333; font-size: 18px; font-weight: bold;">Your Uploaded Photos:</h4>
                    <div id="uploaded-photos-list" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; align-items: center; min-height: 100px;"></div>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }
            
            .photo-thumbnail {
                position: relative;
                cursor: pointer;
                margin: 8px;
                transition: transform 0.2s ease;
            }
            
            .photo-thumbnail:hover {
                transform: scale(1.05);
            }
            
            .photo-thumbnail img {
                width: 100px;
                height: 100px;
                object-fit: cover;
                border-radius: 8px;
                border: 3px solid #007bff;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
            
            .delete-btn {
                position: absolute;
                top: -10px;
                right: -10px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 50%;
                width: 28px;
                height: 28px;
                font-size: 14px;
                cursor: pointer;
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
            }
            
            .delete-btn:hover {
                background: #c82333;
                transform: scale(1.1);
            }
            
            .empty-state {
                color: #666;
                font-style: italic;
                padding: 20px;
                text-align: center;
            }
        </style>
    `;
    
    console.log('✅ Interface created');
    setupClickHandlers();
    resizeWidget(100);
    console.log('✅ Widget setup complete');
}

function setupClickHandlers() {
    console.log('📍 Setting up click handlers...');
    
    // Start camera button
    document.getElementById('start-camera-btn').onclick = function(e) {
        e.preventDefault();
        startCamera();
    };
    
    // Capture button
    document.getElementById('capture-btn').onclick = function(e) {
        e.preventDefault();
        capturePhoto();
    };
    
    // Cancel button
    document.getElementById('cancel-btn').onclick = function(e) {
        e.preventDefault();
        stopCamera();
        showState('initial');
    };
    
    // Approve button
    document.getElementById('approve-btn').onclick = function(e) {
        e.preventDefault();
        approvePhoto();
    };
    
    // Retake button
    document.getElementById('retake-btn').onclick = function(e) {
        e.preventDefault();
        showState('camera');
    };
    
    // Add Another button
    document.getElementById('add-another-btn').onclick = function(e) {
        e.preventDefault();
        showState('initial');
    };
    
    // Done button
    document.getElementById('done-btn').onclick = function(e) {
        e.preventDefault();
        alert('All photos have been uploaded! You can submit the form now.');
    };
}

function showState(stateName) {
    console.log('📍 showState called with:', stateName);
    
    const states = ['initial', 'camera', 'preview', 'uploading', 'thumbnail'];
    states.forEach(state => {
        const element = document.getElementById(state + '-state');
        if (element) element.style.display = 'none';
    });
    
    const targetElement = document.getElementById(stateName + '-state');
    if (targetElement) targetElement.style.display = 'block';
    
    // Update photos display when showing thumbnail state
    if (stateName === 'thumbnail') {
        updateUploadedPhotosDisplay();
    }
    
    // Adjust height based on number of photos
    const photoCount = uploadedPhotos.length;
    const baseHeight = 100;
    const photoHeight = Math.min(photoCount * 30, 200); // Max additional height
    const heights = {
        'initial': baseHeight,
        'camera': 450,
        'preview': 450,
        'uploading': 150,
        'thumbnail': baseHeight + photoHeight + 200 // Base + photos + buttons
    };
    
    resizeWidget(heights[stateName] || baseHeight);
}

function resizeWidget(height) {
    setTimeout(() => {
        try {
            if (typeof window.JFCustomWidget !== 'undefined' && window.JFCustomWidget.resize) {
                window.JFCustomWidget.resize(height);
            } else if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'setHeight', height: height }, '*');
            }
        } catch (e) {
            console.error('❌ Resize error:', e);
        }
    }, 100);
}

async function startCamera() {
    try {
        resizeWidget(450);
        showState('camera');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        currentStream = stream;
        const video = document.getElementById('camera-video');
        if (video) {
            video.srcObject = stream;
            video.onloadedmetadata = () => video.play().catch(console.log);
        }
    } catch (error) {
        alert('Camera error: ' + error.message);
        showState('initial');
        resizeWidget(100);
    }
}

function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
        const video = document.getElementById('camera-video');
        if (video) video.srcObject = null;
    }
}

function capturePhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('photo-canvas');
    
    if (video && canvas && video.videoWidth > 0) {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        stopCamera();
        showState('preview');
    }
}

function approvePhoto() {
    showState('uploading');
    
    setTimeout(() => {
        const canvas = document.getElementById('photo-canvas');
        if (canvas) {
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                
                // Add to uploaded photos array
                const photoData = {
                    url: url,
                    blob: blob,
                    timestamp: Date.now(),
                    fileName: `photo-${Date.now()}-${uploadedPhotos.length + 1}.jpg`
                };
                
                uploadedPhotos.push(photoData);
                
                // Submit to JotForm
                submitPhotoToJotForm(photoData);
                
                updateUploadedPhotosDisplay();
                showState('thumbnail');
                
            }, 'image/jpeg', 0.85);
        }
    }, 1500);
}

function submitPhotoToJotForm(photoData) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            if (typeof window.JFCustomWidget !== 'undefined' && window.JFCustomWidget.submit) {
                // Submit each photo individually
                window.JFCustomWidget.submit({
                    type: 'file',
                    data: {
                        file: reader.result,
                        filename: photoData.fileName,
                        question: `Camera Photo ${uploadedPhotos.length}`,
                        pdfOptions: {
                            display: 'thumbnail',
                            width: 'auto',
                            height: 'auto',
                            alignment: 'center',
                            border: '1px solid #ccc',
                            padding: '5px'
                        }
                    }
                });
                console.log('✅ Photo submitted:', photoData.fileName);
            }
        } catch (e) {
            console.error('❌ Submit error:', e);
        }
    };
    reader.readAsDataURL(photoData.blob);
}

function updateUploadedPhotosDisplay() {
    const photosList = document.getElementById('uploaded-photos-list');
    const photosContainer = document.getElementById('uploaded-photos-container');
    
    if (!photosList || !photosContainer) return;
    
    photosList.innerHTML = '';
    
    if (uploadedPhotos.length === 0) {
        photosList.innerHTML = '<div class="empty-state">No photos uploaded yet</div>';
        photosContainer.style.display = 'none';
        return;
    }
    
    photosContainer.style.display = 'block';
    
    // Display ALL uploaded photos
    uploadedPhotos.forEach((photo, index) => {
        const photoElement = document.createElement('div');
        photoElement.className = 'photo-thumbnail';
        photoElement.innerHTML = `
            <img src="${photo.url}" alt="Photo ${index + 1}">
            <button class="delete-btn" onclick="event.stopPropagation(); window.removePhoto(${index})">✕</button>
        `;
        
        // Click to view full image
        photoElement.onclick = () => window.open(photo.url, '_blank');
        
        photosList.appendChild(photoElement);
    });
}

// Global function to remove photos
window.removePhoto = function(index) {
    if (confirm('Are you sure you want to remove this photo?')) {
        // Revoke the object URL to free memory
        URL.revokeObjectURL(uploadedPhotos[index].url);
        
        // Remove from array
        uploadedPhotos.splice(index, 1);
        
        // Update display
        updateUploadedPhotosDisplay();
        
        // Update JotForm data
        if (typeof window.JFCustomWidget !== 'undefined' && window.JFCustomWidget.submit) {
            // Resubmit all remaining photos
            uploadedPhotos.forEach((photo, idx) => {
                const reader = new FileReader();
                reader.onload = () => {
                    window.JFCustomWidget.submit({
                        type: 'file',
                        data: {
                            file: reader.result,
                            filename: photo.fileName,
                            question: `Camera Photo ${idx + 1}`
                        }
                    });
                };
                reader.readAsDataURL(photo.blob);
            });
        }
        
        // If no photos left, go back to initial state
        if (uploadedPhotos.length === 0) {
            showState('initial');
        }
    }
};

// Initialize
function tryInit() {
    const container = document.getElementById('camera-widget');
    if (container) {
        initCameraWidget();
        return true;
    }
    return false;
}

if (!tryInit()) {
    document.addEventListener('DOMContentLoaded', tryInit);
    setTimeout(tryInit, 100);
}

console.log('📋 Multiple photo upload widget loaded!');
