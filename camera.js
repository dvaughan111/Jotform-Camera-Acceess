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
        <div class="widget-container" style="padding: 20px; text-align: center; background: #f8f9fa; border-radius: 8px;">
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
                    height: 50px;
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
                <canvas id="photo-canvas" style="max-width: 100%; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 15px;"></canvas><br>
                <button id="approve-btn" style="background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px;">✓ Approve</button>
                <button id="retake-btn" style="background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin: 5px;">↻ Retake</button>
            </div>
            
            <!-- UPLOADING STATE -->
            <div id="uploading-state" style="display: none;">
                <p>Uploading...</p>
            </div>
            
            <!-- THUMBNAIL STATE - UPDATED FOR MULTIPLE PHOTOS -->
            <div id="thumbnail-state" style="display: none;">
                <p style="color: green; font-weight: bold; margin-bottom: 15px;">Photo uploaded successfully!</p>
                
                <!-- Action Buttons -->
                <div style="margin: 20px 0; padding: 10px; background: #fff; border-radius: 8px; border: 1px solid #ddd;">
                    <button id="add-another-btn" style="background: #28a745; color: white; padding: 12px 24px; border: none; border-radius: 5px; margin: 8px; cursor: pointer; font-size: 14px;">
                        📷 Add Another Photo
                    </button>
                    <button id="done-btn" style="background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 5px; margin: 8px; cursor: pointer; font-size: 14px;">
                        ✅ Done Uploading
                    </button>
                </div>
                
                <!-- Uploaded Photos Gallery -->
                <div id="uploaded-photos-container" style="margin-top: 25px; padding: 15px; background: #fff; border-radius: 8px; border: 1px solid #ddd;">
                    <h4 style="margin-bottom: 15px; color: #333; font-size: 16px;">Your Uploaded Photos:</h4>
                    <div id="uploaded-photos-list" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; min-height: 50px;"></div>
                </div>
            </div>
        </div>
    `;
    
    console.log('✅ Interface created');
    setupClickHandlers();
    resizeWidget(75);
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
        // You can add any finalization logic here
        alert('Photos uploaded successfully! You can submit the form now.');
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
    const heights = {
        'initial': 75,
        'camera': 400,
        'preview': 400,
        'uploading': 120,
        'thumbnail': Math.min(400 + (uploadedPhotos.length * 80), 600) // Dynamic height
    };
    
    resizeWidget(heights[stateName] || 75);
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
        resizeWidget(400);
        showState('camera');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } }
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
        resizeWidget(75);
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
                    fileName: 'photo-' + Date.now() + '.jpg'
                };
                
                uploadedPhotos.push(photoData);
                
                // Submit to JotForm with proper file data for PDF formatting
                submitPhotoToJotForm(photoData);
                
                updateUploadedPhotosDisplay();
                showState('thumbnail');
                
            }, 'image/jpeg', 0.8);
        }
    }, 1500);
}

function submitPhotoToJotForm(photoData) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            if (typeof window.JFCustomWidget !== 'undefined' && window.JFCustomWidget.submit) {
                // Submit as file array for proper PDF handling
                window.JFCustomWidget.submit({
                    type: 'file[]', // Use array format for multiple files
                    data: {
                        files: [{
                            file: reader.result,
                            filename: photoData.fileName,
                            // Add PDF formatting options
                            pdfOptions: {
                                display: 'thumbnail',     // Show as thumbnail in PDF
                                width: 'auto',           // Auto width
                                height: 'auto',          // Auto height
                                alignment: 'center',     // Center aligned
                                border: '1px solid #ccc', // Light border
                                padding: '5px',          // Padding around image
                                quality: 'high'          // High quality in PDF
                            }
                        }]
                    }
                });
                console.log('✅ Photo submitted with PDF formatting options');
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
        photosList.innerHTML = '<div style="color: #666; font-style: italic;">No photos uploaded yet</div>';
        photosContainer.style.display = 'none';
        return;
    }
    
    photosContainer.style.display = 'block';
    
    // Display all uploaded photos with delete buttons
    uploadedPhotos.forEach((photo, index) => {
        const photoElement = document.createElement('div');
        photoElement.style.position = 'relative';
        photoElement.style.cursor = 'pointer';
        photoElement.style.margin = '5px';
        
        photoElement.innerHTML = `
            <div style="position: relative; display: inline-block;">
                <img src="${photo.url}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px; border: 2px solid #007bff; cursor: pointer;">
                <button onclick="event.stopPropagation(); window.removePhoto(${index})" style="
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    font-size: 12px;
                    cursor: pointer;
                    font-weight: bold;
                    line-height: 1;
                    padding: 0;
                ">✕</button>
            </div>
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
        
        // Update JotForm data (remove the file)
        if (typeof window.JFCustomWidget !== 'undefined' && window.JFCustomWidget.submit) {
            window.JFCustomWidget.submit({
                type: 'file[]',
                data: {
                    files: uploadedPhotos.map(photo => ({
                        file: photo.blob ? URL.createObjectURL(photo.blob) : '',
                        filename: photo.fileName
                    }))
                }
            });
        }
        
        // Update display
        updateUploadedPhotosDisplay();
        
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
