var menuButton = document.getElementById("menu-button");
var menu = document.getElementById("menu");
var content = document.getElementById("content");

menuButton.addEventListener("click", function() {
    if (menu.classList.contains("menu-show")) {
        menu.classList.remove("menu-show");
        menu.classList.add("menu-hide");
        content.classList.add("content-expanded");
    } else {
        menu.classList.remove("menu-hide");
        menu.classList.add("menu-show");
        content.classList.remove("content-expanded");
    }
});

function updateMap(location) {
  var mapIframe = document.getElementById('map-iframe');
  mapIframe.src = 'https://maps.google.com/maps?q=' + location + '&t=&z=15&ie=UTF8&iwloc=&output=embed';
}

document.getElementById('yada-link').addEventListener('click', function (event) {
  event.preventDefault();
  updateMap('q=Yada+Yada+Yada+-+Lanches,+Bar+e+Entretenimento');
});

document.getElementById('pedrao-link').addEventListener('click', function (event) {
  event.preventDefault();
  updateMap('Pedr%C3%A3o+Bar');
});

document.getElementById('boteco-link').addEventListener('click', function (event) {
  event.preventDefault();
  updateMap('Boteco+do+Didi');
});

document.getElementById('taverna-link').addEventListener('click', function (event) {
  event.preventDefault();
  updateMap('Taverna+do+Dragao');
});

document.getElementById('havana-link').addEventListener('click', function (event) {
  event.preventDefault();
  updateMap('Havana+Bar');
});

document.getElementById('cross-link').addEventListener('click', function (event) {
  event.preventDefault();
  updateMap('Crossroads');
});