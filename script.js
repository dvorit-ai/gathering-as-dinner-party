//  ***** ANCHOR NAVIGATION ******

// Function to highlight active anchor links
function setupAnchorNavigation() {
    // Get all the navigation links with href starting with #
    const navLinks = document.querySelectorAll('.secondary-button a[href^="#"]');
    
    // Skip execution if no valid links are found
    if (navLinks.length === 0) return;
    
    // Get all sections (the targets of the anchor links)
    const sections = Array.from(navLinks).map(link => {
        const href = link.getAttribute('href');
        // Skip links without proper href
        if (!href || href === '') return null;
        return document.querySelector(href);
    }).filter(section => section !== null);
    
    // Function to highlight the current section in the navigation
    function highlightNavOnScroll() {
        // Find which section is currently in view
        let currentSection = null;
        let smallestDistance = Infinity;
        
        sections.forEach(section => {
            if (!section) return; // Skip if section doesn't exist
            
            const rect = section.getBoundingClientRect();
            // Calculate distance from top of viewport (with slight offset)
            const distance = Math.abs(rect.top - 100); // 100px offset for better UX
            
            // If this section is closer to the top of the viewport than the previous one
            if (distance < smallestDistance) {
                smallestDistance = distance;
                currentSection = section;
            }
        });
        
        // Remove active class from all links
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Add active class to the corresponding link
        if (currentSection) {
            const id = '#' + currentSection.id;
            const activeLink = document.querySelector(`.secondary-button a[href="${id}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    }
    
    // Highlight the correct link when clicking on a navigation item
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');
        });
    });
    
    // Call the function on scroll (with debounce for performance)
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(highlightNavOnScroll, 100);
    });
    
    // Call it once on page load
    window.addEventListener('load', highlightNavOnScroll);
    
    // Also call after a slight delay to ensure all content is loaded and positioned
    setTimeout(highlightNavOnScroll, 500);
}

// Execute when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', setupAnchorNavigation);



// ***** PHOTO SECTION ******

document.addEventListener('DOMContentLoaded', function() {
    const gallery = document.getElementById('photo-gallery');
    const photos = gallery.querySelectorAll('.film-photos');
    const totalPhotos = photos.length;
    
    function arrangePictures() {
        // Get container width
        const containerWidth = gallery.clientWidth;
        
        // Get average image width (sample from first image)
        const sampleImg = photos[0].querySelector('img');
        let avgImageWidth = sampleImg.clientWidth || sampleImg.offsetWidth;
        
        // If we can't get width yet (images not loaded), use a default estimate
        if (!avgImageWidth) avgImageWidth = 300;
        
        // Calculate how much width we have available for visible portions
        // We want to show approximately 30-50% of each image (except last one)
        const visiblePortion = 0.4; // 40% of each image is visible
        
        // Calculate total width needed for all images if fully visible
        const idealSpacing = (containerWidth - avgImageWidth) / (totalPhotos - 1);
        
        // Position each photo
        photos.forEach((photo, index) => {
            // Set z-index (higher index = higher z-index)
            photo.style.zIndex = index + 1;
            
            // Calculate left position
            let leftPosition;
            if (totalPhotos === 1) {
                // Center the lone image
                leftPosition = (containerWidth - avgImageWidth) / 2;
            } else {
                // Distribute evenly across container
                leftPosition = index * idealSpacing;
            }
            
            // Apply position
            photo.style.left = leftPosition + 'px';
        });
    }
    
    // Initial arrangement
    arrangePictures();
    
    // Rearrange on window resize
    window.addEventListener('resize', arrangePictures);
    
    // Rearrange once images are loaded (for accurate width calculations)
    window.addEventListener('load', arrangePictures);
});




// ZINE DRAGGABLE

document.addEventListener('DOMContentLoaded', function() {
    const zineImages = document.querySelectorAll('.zine-img');
    
    // Variables to track drag state
    let activeZine = null;
    let initialX;
    let initialY;
    let currentX;
    let currentY;
    let xOffset = 0;
    let yOffset = 0;
    
    // Randomize initial positions slightly (optional)
    zineImages.forEach(zine => {
        // Get current position
        const style = window.getComputedStyle(zine);
        const top = parseInt(style.top);
        const left = parseInt(style.left);
        
        // Set initial z-index
        zine.style.zIndex = 1;
    });
    
    // Add event listeners for mouse interactions
    zineImages.forEach(zine => {
        // Start drag
        zine.addEventListener('mousedown', dragStart);
        
        // Bring to front on click (without drag)
        zine.addEventListener('click', function() {
            bringToFront(this);
        });
    });
    
    // Global mouse events
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    // Touch events for mobile
    zineImages.forEach(zine => {
        zine.addEventListener('touchstart', touchStart, { passive: false });
    });
    document.addEventListener('touchmove', touchMove, { passive: false });
    document.addEventListener('touchend', touchEnd);
    
    // Drag functions
    function dragStart(e) {
        activeZine = this;
        
        // Get current position
        const style = window.getComputedStyle(activeZine);
        const topValue = parseInt(style.top) || 0;
        const leftValue = parseInt(style.left) || 0;
        
        initialX = e.clientX - leftValue;
        initialY = e.clientY - topValue;
        
        // Set active styling
        activeZine.classList.add('dragging');
        
        // Bring to front
        bringToFront(activeZine);
        
        e.preventDefault();
    }
    
    function drag(e) {
        if (activeZine) {
            e.preventDefault();
            
            // Calculate new position
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            // Boundary checks (optional)
            const container = document.getElementById('zine-container');
            const zineWidth = activeZine.offsetWidth;
            const zineHeight = activeZine.offsetHeight;
            
            // Set bounds with some overflow allowed
            const minX = -zineWidth / 2;
            const maxX = container.offsetWidth - zineWidth / 2;
            const minY = -zineHeight / 2;
            const maxY = container.offsetHeight - zineHeight / 2;
            
            // Apply bounds
            currentX = Math.max(minX, Math.min(currentX, maxX));
            currentY = Math.max(minY, Math.min(currentY, maxY));
            
            // Set position
            setTranslate(currentX, currentY, activeZine);
        }
    }
    
    function dragEnd(e) {
        if (activeZine) {
            // Save final position to top/left instead of transform
            // This makes subsequent drags calculate correctly
            activeZine.style.top = currentY + 'px';
            activeZine.style.left = currentX + 'px';
            activeZine.style.transform = 'none';
            
            // Remove active styling
            activeZine.classList.remove('dragging');
            
            activeZine = null;
        }
    }
    
    // Touch event handlers
    function touchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            activeZine = this;
            
            // Get current position
            const style = window.getComputedStyle(activeZine);
            const topValue = parseInt(style.top) || 0;
            const leftValue = parseInt(style.left) || 0;
            
            initialX = touch.clientX - leftValue;
            initialY = touch.clientY - topValue;
            
            // Set active styling
            activeZine.classList.add('dragging');
            
            // Bring to front
            bringToFront(activeZine);
            
            e.preventDefault();
        }
    }
    
    function touchMove(e) {
        if (activeZine && e.touches.length === 1) {
            e.preventDefault();
            
            const touch = e.touches[0];
            
            // Calculate new position
            currentX = touch.clientX - initialX;
            currentY = touch.clientY - initialY;
            
            // Set position
            setTranslate(currentX, currentY, activeZine);
        }
    }
    
    function touchEnd(e) {
        if (activeZine) {
            // Save final position
            activeZine.style.top = currentY + 'px';
            activeZine.style.left = currentX + 'px';
            activeZine.style.transform = 'none';
            
            // Remove active styling
            activeZine.classList.remove('dragging');
            
            activeZine = null;
        }
    }
    
    // Helper functions
    function setTranslate(xPos, yPos, el) {
        el.style.left = xPos + 'px';
        el.style.top = yPos + 'px';
    }
    
    function bringToFront(el) {
        // Find highest z-index
        let highestZ = 0;
        zineImages.forEach(zine => {
            const zIndex = parseInt(window.getComputedStyle(zine).zIndex) || 0;
            if (zIndex > highestZ) {
                highestZ = zIndex;
            }
        });
        
        // Set this element to be one higher
        el.style.zIndex = highestZ + 1;
    }
});