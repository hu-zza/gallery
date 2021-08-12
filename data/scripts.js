const MAX_LONG_EDGE_MINIMUM = 4000;
const LENGTH_STEP = 1000;
const DISPLAY_FALLBACK = true;
const IMAGES_META  = "/gallery/data/index.json";
const IMAGES_ROOT  = "/gallery/data/images/";
const SPINNER_NODE = document.querySelector("div.spinner-grid").cloneNode(true);


let imageIndex = 0;
let imageCatalog = []
let longEdgeMinimum = 0;



let request = new XMLHttpRequest();
request.open("GET", IMAGES_META);
request.responseType = "json";

request.onload = function () {
    imageCatalog = request.response;
    $(".javaScriptDependent").removeClass("disabled");
    initializeGallery();
}

request.send();



function initializeGallery() {
    setImageResolutionAutomatically();
    tryToFetchImageIndex();
    refreshThumbnails();
    updateMainComponents();
}


function setImageResolutionAutomatically() {
    longEdgeMinimum = Math.max(window.screen.width, window.screen.height);

    longEdgeMinimum = Math.min(MAX_LONG_EDGE_MINIMUM,
        Math.ceil(longEdgeMinimum / LENGTH_STEP) * LENGTH_STEP);

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
    let nav = document.querySelector("nav");
    let thumbnails = createAllThumbnails();

    nav.innerText = "";
    nav.append(thumbnails);
}


function createAllThumbnails() {
    let result = document.createDocumentFragment();

    imageCatalog.forEach(
        (img, iter) => result.append(createThumbnail(img, iter)));

    return result;
}


function createThumbnail(imageObject, id) {
    let result = createThumbnailFrame(imageObject, id);

    result.append(SPINNER_NODE.cloneNode(true));
    result.append(createThumbnailContainer(id));

    return result;
}


function createThumbnailFrame(img, id) {
    let result = document.createElement("a");

    result.id    = `thumbnail_${id}`;
    result.href  = `#${id}`;
    result.title = img.details && img.details.title ? img.details.title : "[without title]";
    result.onclick = () => chooseImageByIndex(id);

    return result;
}


function createThumbnailContainer(id) {
    let result = document.createElement("div");

    result.className = "thumbnail-container"
    result.style.backgroundImage = `url(${getThumbnailLink(id)})`;

    return result;
}


function getThumbnailLink(index) {
    let rawLink = imageCatalog[index].image.thumbnail;
    
    return completeLink(rawLink ? rawLink : getDisplayLink(index, LENGTH_STEP));
}


function getDisplayLink(index, targetLongEdgeMinimum) {
    let displayObject = imageCatalog[index].image.display;

    let rawLink = getLinkFromDisplayObject(displayObject, targetLongEdgeMinimum);

    if (rawLink === "") {
        rawLink = getFullResolutionLink(index);
    }

    if (rawLink === "" && DISPLAY_FALLBACK) {
        rawLink = getFallbackDisplayLink(displayObject);
    }

    return completeLink(rawLink);
}


function getLinkFromDisplayObject(displayObject, edgeMinimum) {
    if (displayObject) {
        while (edgeMinimum <= MAX_LONG_EDGE_MINIMUM) {

            if (displayObject[edgeMinimum]) {
                return displayObject[edgeMinimum];
            }

            edgeMinimum += LENGTH_STEP;
        }
    }

    return "";
}


function getFallbackDisplayLink(displayObject) {
    if (displayObject) {
        for (let i = MAX_LONG_EDGE_MINIMUM; 0 < i; i -= LENGTH_STEP) {
            if (displayObject[i]) {
                return displayObject[i];
            }
        }
    }

    return "";
}


function getFullResolutionLink(index) {
    return imageCatalog[index].image.full || "";
}


function completeLink(rawUrl) {
    if (rawUrl.startsWith(IMAGES_ROOT) || 
        rawUrl.startsWith("https://")  || 
        rawUrl.startsWith("http://")) {
        return rawUrl;
    } else {
        return `${IMAGES_ROOT}${rawUrl}`;
    }
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
    let link = getDisplayLink(imageIndex, longEdgeMinimum);
    $("main").css("background-image", `url(${link})`);
    $("div.modal.fullscreen img").attr("src", link);
}


function refreshTextContainers() {
    let details = imageCatalog[imageIndex].details || {};

    let title = details.title || "[without title]";
    let caption = `${details.author || "[unknown author]"}  –  ${title}`;

    $("div.details h1").text(caption);
    $("div.details h1").attr("title", caption);
    $("div.details p").text(details.description || "[without description]");
    $("div.details a").text(details.url || "[without external link]");
    $("div.details a").attr("href", details.url || location.href);
    $("div.details a").attr("title", 
        details.url ? `External link about image: ${title}` : "[without external link]");

    $("div.fullscreen img").attr("alt", caption);
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
    let color = $("input#backgroundColor").val();
    $("body").css("backgroundColor", color);
    $("div.modal.fullscreen").css("backgroundColor", color);
}


function setImageResolution() {
    longEdgeMinimum = Math.min(MAX_LONG_EDGE_MINIMUM, $("select#imageResolution").val());
    refreshMainImageContainers();
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


function addToImageIndex(value) {
    let length = imageCatalog.length;

    imageIndex += value % length;

    if (imageIndex < 0) {
        imageIndex += length - 1;
    } else if (length <= imageIndex) {
        imageIndex -= length;
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

$("input#backgroundColor").change(setBackgroundColor);
$("select#imageResolution").change(setImageResolution);
$("button.details").click(toggleDetails);

$("button#fullscreen").click(fullscreenImage);
$("button#previous").click(previousImage);
$("button#next").click(nextImage);

let fullscreenModal = document.querySelector("div.modal.fullscreen");
fullscreenModal.addEventListener('click', exitFullscreenImage);
fullscreenModal.addEventListener('touchstart', markTouchStart);
fullscreenModal.addEventListener('touchend', chooseImageBySwipe);
