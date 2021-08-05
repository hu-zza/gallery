let request = new XMLHttpRequest();
request.open("GET", "https://hu-zza.github.io/gallery/data/index.json");
request.responseType = "json";
request.send();


let imageCatalog = []

request.onload = function () {
    imageCatalog = request.response;
    startGallery();
}


function startGallery() {
    $(".javaScriptDependent").toggleClass("disabled");
    tryToFetchImageIndex();
    refreshThumbnails();
    updateMainComponents();
}


function tryToFetchImageIndex() {
    let hashIndex = location.href.lastIndexOf("#");

    if (-1 < hashIndex) {
        imageIndex = parseInt(location.href.substr(hashIndex + 1));
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
    return rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : `https://hu-zza.github.io/gallery/data/pictures/${rawUrl}`;
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

    $("div.details h1").text(`${current.details.author}  –  ${current.details.title}`);
    $("div.details h1").attr("title", `${current.details.author}  –  ${current.details.title}`);
    $("div.details p").text(current.details.description);
    $("div.details a").text(current.details.url);    
    $("div.details a").attr("href", current.details.url);    
}


function updateActiveFlagOfThumbnails() {
    $("nav a.active").removeClass("active");
    $(`nav a#thumbnail_${imageIndex}`).addClass("active");
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


function setBackgroundColor() {
    let color = $("input#background").val();
    $("body").css("background", color);
    $("div.modal.fullscreen").css("background", color);
}


function fullscreenImage() {
    scrollToTop();
    $("body").addClass("locked");
    $("div.modal.fullscreen").removeClass("hidden");
}


function exitFullscreenImage() {
    $("div.modal.fullscreen").addClass("hidden");
    $("body").removeClass("locked");
}


function toggleDetails() {
    $("body").toggleClass("locked");
    $("div.modal.details").toggleClass("hidden");
    $("button.details").toggleClass("close");
}


function scrollToTop() {
    window.scrollTo(0, 0);
}


function previousImage() {
    addToIndex(-1);
    updateMainComponents();
}


function nextImage() {
    addToIndex(1);
    updateMainComponents();
}


function chooseImageByIndex(index) {
    setIndex(index);
    updateMainComponents();
}


let imageIndex = 0;

function addToIndex(value) {
    imageIndex += value;

    if (imageIndex < 0) {
        imageIndex += imageCatalog.length - 1;
    } else if (imageCatalog.length <= imageIndex) {
        imageIndex -= imageCatalog.length;
    }
}

function setIndex(index) {
    imageIndex = Math.min(
        Math.max(0, index),
        imageCatalog.length - 1);
}


$("input#background").change(setBackgroundColor);
document.addEventListener('keydown', keyDownHandler);

$("button#previous").click(previousImage);
$("button#fullscreen").click(fullscreenImage);
$("button#next").click(nextImage);
$("div.modal.fullscreen").click(exitFullscreenImage);

$("button.details").click(toggleDetails);
