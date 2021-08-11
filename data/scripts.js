let request = new XMLHttpRequest();
request.open("GET", "https://hu-zza.github.io/gallery/data/index.json");
request.responseType = "json";

request.onload = function () {
    imageCatalog = request.response;
    $(".javaScriptDependent").removeClass("disabled");
    initializeGallery();
}

request.send();


const MAX_LONG_EDGE_MINIMUM = 4000;
let imageCatalog = []
let longEdgeMinimum = 0;


function initializeGallery() {
    setImageResolutionAutomatically();
    tryToFetchImageIndex();
    refreshThumbnails();
    updateMainComponents();
}


function setImageResolutionAutomatically() {
    longEdgeMinimum = Math.max(window.screen.availWidth, window.screen.availHeight);
    longEdgeMinimum = Math.min(MAX_LONG_EDGE_MINIMUM, Math.ceil(longEdgeMinimum / 1000) * 1000);
    $("select#imageResolution > *").removeAttr("selected");
    $(`select#imageResolution > [value="${longEdgeMinimum}"]`).attr("selected", "selected");
}


function tryToFetchImageIndex() {
    let hashIndex = location.href.lastIndexOf("#");

    if (-1 < hashIndex) {
        setImageIndex(parseInt(location.href.substr(hashIndex + 1)));
    }
}


function refreshThumbnails() {
    $("nav").text("");
    imageCatalog.forEach(createThumbnail);
}


function createThumbnail(image, id) {
    $("nav").append(
        `<a href="#${id}" id="thumbnail_${id}" onClick="chooseImageByIndex(${id})" title="${image.details.title}">
            <div style="background-image: url(${getThumbnailLink(id)});"></div>
        </a>`);
}


function getThumbnailLink(index) {
    let current = imageCatalog[index];

    let rawLink = current.image.thumbnail != "" ?
        current.image.thumbnail :
        getDisplayLink(index);

    return completeLink(rawLink);
}


function getDisplayLink(index) {
    let current = imageCatalog[index];

    let rawLink = current.image.display != "" ?
        current.image.display :
        getFullResolutionLink(index);

    return completeLink(rawLink);
}


function getFullResolutionLink(index) {
    return imageCatalog[index].image.full;
}


function completeLink(rawUrl) {
    return rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : `https://hu-zza.github.io/gallery/data/images/${rawUrl}`;
}


function updateMainComponents() {
    updateLocationHref();
    refreshMainImageContainers();
    refreshTextContainers();
    updateActiveFlagOfThumbnails();
}


function updateLocationHref() {
    let base = location.href.split("#")[0];
    location.replace(base + "#" + imageIndex);
}


function refreshMainImageContainers() {
    let link = getDisplayLink(imageIndex);
    $("main").css("background-image", `url(${link})`);
    $("div.modal.fullscreen img").attr("src", link);
}


function refreshTextContainers() {
    let current = imageCatalog[imageIndex];

    let title = `${current.details.author}  –  ${current.details.title}`;
    $("div.details h1").text(title);
    $("div.details h1").attr("title", title);
    $("div.details p").text(current.details.description);
    $("div.details a").text(current.details.url);
    $("div.details a").attr("href", current.details.url);
    $("div.details a").attr("title", `External link about image: ${current.details.title}`);
    $("div.fullscreen img").attr("alt", title);
}


function updateActiveFlagOfThumbnails() {
    $("nav a.active").removeClass("active");
    $(`nav a#thumbnail_${imageIndex}`).addClass("active");
}


function blurClickTarget(event) {
    if (!event.target.classList.contains("needFocus")) {
        event.target.blur();
    }
}


function keyDownHandler(event) {
    if (event.key === "ArrowLeft") {
        previousImage();
    } else if (event.key === "ArrowRight") {
        nextImage();
    } else if (event.key === "Enter") {
        fullscreenImage();
    } else if (event.key === "Escape") {
        exitFullscreenImage();
    }
}


function syncFullscreen() {
    if (document.fullscreenElement === null) {
        exitFullscreenImage();
    } else {
        fullscreenImage();
    }
}


function setBackgroundColor() {
    let color = $("input#background").val();
    $("body").css("background", color);
    $("div.modal.fullscreen").css("background", color);
}


function toggleDetails() {
    $("body").toggleClass("locked");
    $("div.modal.details").toggleClass("hidden");
    $("button.details").toggleClass("close");
    
    let button = document.querySelector("button.details");
    button.title = button.title === "Show details" ? "Close details" : "Show details";
}


function fullscreenImage() {
    scrollToTop();
    $("body").addClass("locked");
    $("div.modal.fullscreen").removeClass("hidden");
    if (document.fullscreenElement === null) {
        document.documentElement.requestFullscreen();
    }
}


function scrollToTop() {
    window.scrollTo(0, 0);
}


function exitFullscreenImage() {
    $("div.modal.fullscreen").addClass("hidden");
    $("body").removeClass("locked");
    if (document.fullscreenElement !== null) {
        document.exitFullscreen();
    }
}


function previousImage() {
    addToImageIndex(-1);
    updateMainComponents();
}


function nextImage() {
    addToImageIndex(1);
    updateMainComponents();
}


function chooseImageByIndex(index) {
    setImageIndex(index);
    updateMainComponents();
}


let imageIndex = 0;

function addToImageIndex(value) {
    imageIndex += value;

    if (imageIndex < 0) {
        imageIndex += imageCatalog.length - 1;
    } else if (imageCatalog.length <= imageIndex) {
        imageIndex -= imageCatalog.length;
    }
}

function setImageIndex(index) {
    if (isFinite(index)) {
        index %= imageCatalog.length;

        imageIndex = 0 <= index ? index : imageCatalog.length + index;
    } else {
        imageIndex = 0;
    }
}


//
// Based on 'Simple Swipe with Vanilla JavaScript' by Ana Tudor
//
// https://css-tricks.com/simple-swipe-with-vanilla-javascript/

let x0 = null;


function unifyTouch(event) {
    return event.changedTouches ? event.changedTouches[0] : event;
}


function markTouchStart(event) {
    x0 = unifyTouch(event).clientX;
}


function chooseImageBySwipe(event) {
    if (x0 || x0 === 0) {
        let dx = unifyTouch(event).clientX - x0

        if (50 < Math.abs(dx)) {
            addToImageIndex(0 - Math.sign(dx));
            updateMainComponents();
        }

        x0 = null;
    }
}



document.addEventListener('click', blurClickTarget);
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('fullscreenchange', syncFullscreen);

$("input#background").change(setBackgroundColor);
$("button.details").click(toggleDetails);

$("button#fullscreen").click(fullscreenImage);
$("button#previous").click(previousImage);
$("button#next").click(nextImage);

let fullscreenModal = document.querySelector("div.modal.fullscreen");
fullscreenModal.addEventListener('click', exitFullscreenImage);
fullscreenModal.addEventListener('touchstart', markTouchStart);
fullscreenModal.addEventListener('touchend', chooseImageBySwipe);

