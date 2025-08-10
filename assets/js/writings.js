function setupAnimation({
  selector,
  animationClass,
  duration = 1500,
  onLoad = false,
  onHover = true,
}) {
  const element =
    typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!element) return;

  let isAnimating = false;

  function triggerAnimation() {
    if (isAnimating) return;
    isAnimating = true;
    element.classList.add(animationClass);

    setTimeout(() => {
      element.classList.remove(animationClass);
      isAnimating = false;
    }, duration);
  }

  if (onLoad) {
    setTimeout(triggerAnimation, 2000); // or 0 for immediate
  }

  if (onHover) {
    element.addEventListener("mouseenter", triggerAnimation);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  setupAnimation({
    selector: "#avatar-photo",
    animationClass: "spin",
    duration: 3000,
    onLoad: false,
    onHover: true,
  });

  // You can reuse it for other elements too:
  setupAnimation({
    selector: "#hat",
    animationClass: "greet",
    duration: 1500,
    onLoad: true,
    onHover: true,
  });
});
