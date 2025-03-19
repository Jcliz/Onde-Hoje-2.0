var menuButton = document.getElementById("menu-button");
var menu = document.getElementById("menu");

menuButton.addEventListener("click", function() {
  if (menu.classList.contains("menu-show")) {
    menu.classList.remove("menu-show");
    menu.classList.add("menu-hide");
  } else {
    menu.classList.remove("menu-hide");
    menu.classList.add("menu-show");
  }
});