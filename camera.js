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
    
    // Cloudinary credentials
    const CLOUDINARY_CLOUD_NAME = 'du0puu5mt'; 
    const UPLOAD_PRESET = 'jotform_widget_upload'; 

    // Convert data URL to blob
    const blob = dataURLToBlob(dataUrl);
    
    // Create form data for Cloudinary upload
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', UPLOAD_PRESET);

   
