'use strict';

const popup = document.querySelector('.popup');
const popupClose = document.querySelector('.popup-close');
const addButton = document.querySelector('.add');
const place = document.querySelector('.place');
const youName = document.querySelector('.youName');
const text = document.querySelector('.text');
const headerText = document.querySelector('.header-address');
const reviewsContainer = document.querySelector('.reviews-container');
let storage = localStorage;

popupClose.addEventListener('click', function () {
    popup.style.display = 'none';
    reviewsContainer.innerHTML = '';
});

ymaps.ready(init);

function init() {
    let myMap = new ymaps.Map('map', {
        center: [55.753994, 37.622093], //Москва
        zoom: 11
    });

    window.addEventListener('load', function () {
        renderReviews('reviewsArray');
    });

    window.addEventListener('click', e => {
        let target = e.target;

        if (target.tagName === 'A') {
            myMap.balloon.close();
            let currentAddress = target.textContent;
            let reviewsForBalloon = JSON.parse(storage.getItem('reviewsArray')) || [];

            popup.style.top = `${e.clientY + 10}px`;
            popup.style.left = `${e.clientX + 10}px`;
            popup.style.display = 'block';
            reviewsForBalloon.forEach(function (review) {
                let checkAddress= review.address;

                if (currentAddress === checkAddress) {
                    renderReview(review);
                    addButton.onclick = function () {
                        let coords = review.coords;
                        handlerButtonClick(coords);
                    };
                }
            });
        }
    });

    let customItemContentLayout = ymaps.templateLayoutFactory.createClass(
        // Флаг "raw" означает, что данные вставляют "как есть" без экранирования html.
        '<div><a href=#>{{ properties.balloonContentHeader|raw }}</a></div>' +
        '<div class=ballon_body>{{ properties.balloonContentBody|raw }}</div>'
    );

    let clusterer = new ymaps.Clusterer({
        clusterNumbers: [3],
        clusterIconContentLayout: null,
        clusterDisableClickZoom: true,
        clusterOpenBalloonOnClick: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonItemContentLayout: customItemContentLayout,
        clusterBalloonPanelMaxMapArea: 0,
        clusterBalloonPagerSize: 5,
        preset: 'islands#invertedBlackClusterIcons'
    });

    clusterer.events.add(['mouseenter', 'mouseleave', 'click'], function (e) {
            handlerClusterer(e);
            });

    myMap.events.add('click', function (event) {
        reviewsContainer.innerHTML = '';
        let coords = event.get('coords');

        ymaps.geocode(coords).then(function(res) {
            let firstGeoObject = res.geoObjects.get(0);
            let address = firstGeoObject.getAddressLine();

            popup.style.display = 'block';
            headerText.textContent = address;
        });
        popup.style.top = `${event.get('clientY') + 10}px`;
        popup.style.left = `${event.get('clientX') + 10}px`;
        popup.style.display = 'block';
        addButton.onclick = function () {
            handlerButtonClick(coords);
        };

    });

    function createPlacemark(coords, reviewObj) {
        let placemarks = [];
        let placemark = new ymaps.Placemark(coords, {
                hintContent: reviewObj.address,
                balloonContentHeader: reviewObj.address,
                balloonContentBody: `<p><br>${reviewObj.name}</p><br><p>${reviewObj.place}`+
                                    `</p><br><p>${reviewObj.text}</p>`,
                balloonContentFooter: ``
            },

            {
                openballoonOnClick: false,
                iconLayout: 'default#image',
                iconImageHref: 'img/point.png',
                iconImageSize: [30, 42],
                openBalloonOnClick: false
            }
        );

        placemark.events.add(['mouseenter', 'mouseleave', 'click'], function (e) {
            handlerPlacemark(e, placemark);
                });
        placemarks.push(placemark);
        clusterer.add(placemarks);
        myMap.geoObjects.add(clusterer);
    }


    function renderReviews(nameStorage) {
        let reviewsForRender = JSON.parse(storage.getItem(nameStorage)) || [];

        reviewsForRender.forEach(function (review) {
            let coordsRender = review.coords;
            let reviewObjRender = {
                address: review.address,
                name: review.name,
                place: review.place,
                text: review.text
            };

            createPlacemark(coordsRender, reviewObjRender);
        });
    }
}

function getData() {
    const optionsData = {day: 'numeric', month: 'numeric', year: 'numeric'};
    const userData = new Date().toLocaleString('ru-RU', optionsData);

    return userData;
}

function handlerButtonClick(coords) {
    const reviewObj = {
        coords: coords,
        address: headerText.textContent,
        date: getData(),
        name: youName.value,
        place: place.value,
        text: text.value
    };
    const allReviews = JSON.parse(storage.getItem('reviewsArray')) || [];

    allReviews.push(reviewObj);
    storage.setItem('reviewsArray', JSON.stringify(allReviews));
    createPlacemark(coords, reviewObj);
    popup.style.display = 'none';
}

function handlerPlacemark(e, placemark) {
    let target = e.get('target');
    let type = e.get('type');

    if (type === 'mouseenter') {
        target.options.set('iconImageHref', 'img/pointActive.png');
    } else if (type === 'mouseleave') {
        target.options.set('iconImageHref', 'img/point.png');
    } else if (type === 'click') {
        popup.style.top = `${e.get('clientY') + 5}px`;
        popup.style.left = `${e.get('clientX') + 15}px`;
        popup.style.display = 'block';
        addButton.onclick = function () {
            let placemarkCoords = placemark.geometry.getCoordinates();

            handlerButtonClick(placemarkCoords);
            popup.style.display = 'none';
        };
        let placemarkCoords = placemark.geometry.getCoordinates();
        let reviewsForCoords = JSON.parse(storage.getItem('reviewsArray')) || [];

        reviewsForCoords.forEach(function (review) {
            let coordsRender = review.coords;

            if (placemarkCoords[0] === coordsRender[0] && placemarkCoords[1] === coordsRender[1]) {
                renderReview(review);
            }
        });

    }
}

function handlerClusterer(e) {
    let target = e.get('target');
    let type = e.get('type');

    if (type === 'mouseenter') {
        target.options.set('preset', 'islands#invertedOrangeClusterIcons');
    } else if (type === 'mouseleave' || type === 'click') {
        target.options.set('preset', 'islands#invertedBlackClusterIcons');
    }
}

function renderReview(review) {
    const nodeReview = document.createElement('div');
    let template = `<div class="review">${review.name} ${review.place} ${review.date}</div><br>`+
        `<div class="review">${review.text}</div>`;

    headerText.innerHTML = review.address;
    nodeReview.innerHTML = template;
    reviewsContainer.appendChild(nodeReview);
}