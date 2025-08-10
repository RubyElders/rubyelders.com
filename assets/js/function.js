document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => {
    const hat = document.getElementById("hat");
    hat.style.animation = "wave-hat 1.5s ease-in-out forwards";

    // clear the animation for hover
    setTimeout(() => {
      hat.style.animation = "";
    }, 1500);
  }, 1000);
});
