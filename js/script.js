document.addEventListener("DOMContentLoaded", async function () {
  const elementIds = [
    "ParkMckinleyWest",
    "UptownArtsResidence", 
    "UptownModern",
    "_9CentralPark"
  ];

  // Create Web Worker for image preloading
  const preloadWorker = new Worker('preloadWorker.js');

  // Load functions in parallel using Promise.all
  await Promise.all(elementIds.map(async id => {
    const element = document.getElementById(id);
    if (element) {
      const functionName = id.charAt(0).toUpperCase() + id.slice(1);
      if (typeof window[functionName] === "function") {
        try {
          await window[functionName]();
        } catch (err) {
          console.error(`Error loading ${functionName}:`, err);
        }
      }
    }
  }));
});

// Cache for fetched data
let imageDataCache = null;
let gridItemsCache = null;

// Helper functions to fetch and cache data
async function getImageData() {
  if (!imageDataCache) {
    const response = await fetch('./data/generateSlides.json');
    imageDataCache = await response.json();
  }
  return imageDataCache;
}

async function getGridItemsData() {
  if (!gridItemsCache) {
    const response = await fetch('./data/generateGridItems.json');
    gridItemsCache = await response.json(); 
  }
  return gridItemsCache;
}

//=========================== ParkMckinleyWest
async function ParkMckinleyWest() {
  const [imageData, gridData] = await Promise.all([
    getImageData(),
    getGridItemsData()
  ]);

  console.log('Property Data:', imageData.ParkMckinleyWest);

  const propertyData = imageData.ParkMckinleyWest;
  if (!propertyData) {
    console.error('Property data is undefined');
    return;
  }

  generateSlides("Facade1", propertyData.Facade);
  generateSlides("Actual1", propertyData["1BedroomUnit"]);
  generateSlides("Actual2", propertyData["2BedroomUnit"]); 
  generateSlides("Floorplan", propertyData.Floorplan);
  await generateGridItems("CardsUnitLayout", gridData["ParkMckinleyWest"]);
}

//=========================== UptownArtsResidence 
async function UptownArtsResidence() {
  const [imageData, gridData] = await Promise.all([
    getImageData(),
    getGridItemsData()
  ]);

  const propertyData = imageData.UptownArtsResidence;
  generateSlides("Facade1", propertyData.Facade);
  generateSlides("Floorplan", propertyData.Floorplan);

  await generateGridItems("CardsUnitLayout",  gridData["UptownArtsResidence"]);
}

//=========================== UptownModern
async function UptownModern() {
  const [imageData, gridData] = await Promise.all([
    getImageData(),
    getGridItemsData()
  ]);

  const propertyData = imageData.UptownModern;
  generateSlides("Facade1", propertyData.Facade);
  generateSlides("Amenities", propertyData.Amenities);
  generateSlides("Floorplan", propertyData.Floorplan);
  generateSlides("UnitRender", propertyData.UnitRenders);

  await generateGridItems("CardsUnitLayout", gridData["UptownModern"]);
}

//=========================== 9CentralPark
async function _9CentralPark() {
  const [imageData, gridData] = await Promise.all([
    getImageData(),
    getGridItemsData()
  ]);

  const propertyData = imageData["9CentralPark"];
  generateSlides("Facade", propertyData.Facade);
  generateSlides("UnitRender", propertyData.UnitRenders);
  generateSlides("Floorplan", propertyData.Floorplan);

  await generateGridItems("CardsUnitLayout", gridData["9CentralPark"]);
}



// Multithreading with Web Workers for CPU-intensive tasks
function createWorker(taskFunc) {
  const blob = new Blob([`self.onmessage = ${taskFunc.toString()}`], { type: "application/javascript" });
  const worker = new Worker(URL.createObjectURL(blob));
  return worker;
}

function generateSlides(containerId, imagePaths) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const content = container.querySelector(".slider");
  const dotsContainer = container.querySelector(".dots-container");
  const blurBackground = container.querySelector(".blurred-bg");
  if (!content || !dotsContainer || !blurBackground || !imagePaths.length) return;

  let currentSlide = 0, touchStartX = 0, touchEndX = 0, autoplayInterval;

  const slides = imagePaths.map((path, index) => {
    const slide = document.createElement('div');
    slide.className = `slide ${index === 0 ? 'active' : ''}`;
    
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = path;
    
    if (index === 0) {
      blurBackground.style.backgroundImage = `url(${path})`;
    }

    img.onerror = () => {
      console.error(`Failed to load image: ${path}`);
      img.src = 'path/to/fallback-image.jpg';
    };

    slide.appendChild(img);
    return slide;
  });

  content.append(...slides);
  const dots = imagePaths.map((_, index) => {
    const dot = document.createElement('div');
    dot.className = `dot ${index === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => goToSlide(index));
    return dot;
  });
  dotsContainer.append(...dots);

  function goToSlide(index) {
    slides[currentSlide].classList.remove('active');
    slides[index].classList.add('active');
    dots[currentSlide].classList.remove('active');
    dots[index].classList.add('active');
    blurBackground.style.backgroundImage = `url(${imagePaths[index]})`;
    currentSlide = index;
  }

  function nextSlide() { goToSlide((currentSlide + 1) % slides.length); }
  function prevSlide() { goToSlide((currentSlide - 1 + slides.length) % slides.length); }

  container.querySelector('.prev').addEventListener('click', () => {
    clearInterval(autoplayInterval);
    prevSlide();
    startAutoplay();
  });
  container.querySelector('.next').addEventListener('click', () => {
    clearInterval(autoplayInterval);
    nextSlide();
    startAutoplay();
  });

  content.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    clearInterval(autoplayInterval);
  }, { passive: true });

  content.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].clientX;
    if (Math.abs(touchStartX - touchEndX) > 50) (touchStartX - touchEndX > 0) ? nextSlide() : prevSlide();
    startAutoplay();
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      clearInterval(autoplayInterval);
      (e.key === 'ArrowLeft') ? prevSlide() : nextSlide();
      startAutoplay();
    }
  });

  function startAutoplay() {
    clearInterval(autoplayInterval);
    autoplayInterval = setInterval(nextSlide, 5000);
  }

  container.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
  container.addEventListener('mouseleave', startAutoplay);
  startAutoplay();
}

function generateGridItems(containerId, gridItemsData) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = gridItemsData.map((item, index) => `
    <div class="grid-item" style="--i: ${index}">
      <div class="image-wrapper">
        <img data-src="${item.imageSrc}" class="lazy-image" loading="lazy" alt="${item.title}" />
      </div>
      <div class="content-wrapper">
        <div class="text-content">
          <div class="title">${item.title}</div>
          <div class="subtitle">${item.subtitle}</div>
        </div>
        <div class="bottom-content">
          <div class="details">
            <i class="fas fa-maximize"></i> 
            ${parseFloat(item.area).toFixed(2)} SQM
          </div>
          <a href="./Contact" class="btn">
            <span class="btn-text">GET QUOTE</span>
            <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      </div>
    </div>
  `).join('');

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '50px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.classList.contains('lazy-image')) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.onload = () => img.classList.add('loaded');
          observer.unobserve(img);
        }
      }
    });
  }, observerOptions);

  // Observe grid items and images for lazy loading and animations
  container.querySelectorAll('.grid-item').forEach(item => observer.observe(item));
  container.querySelectorAll('.lazy-image').forEach(img => observer.observe(img));
}
