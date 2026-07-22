import { gsap } from "gsap";

export function initPageAnimations() {
  const elements = document.querySelectorAll("[data-animate]");

  if (!elements.length) {
    return;
  }

  gsap.from(elements, {
    opacity: 0,
    y: 24,
    duration: 0.65,
    stagger: 0.08,
    ease: "power3.out",
    clearProps: "transform",
  });
}

export function fadeIn(element) {
  if (!element) {
    return;
  }

  gsap.fromTo(
    element,
    {
      opacity: 0,
      y: 16,
    },
    {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: "power2.out",
    },
  );
}

export function fadeOut(element) {
  if (!element) {
    return Promise.resolve();
  }

  return gsap.to(element, {
    opacity: 0,
    y: -16,
    duration: 0.3,
    ease: "power2.in",
  });
}

export function scaleIn(element) {
  if (!element) {
    return;
  }

  gsap.fromTo(
    element,
    {
      opacity: 0,
      scale: 0.94,
    },
    {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      ease: "back.out(1.4)",
    },
  );
}

export function pulse(element) {
  if (!element) {
    return;
  }

  gsap.fromTo(
    element,
    {
      scale: 1,
    },
    {
      scale: 1.05,
      repeat: 1,
      yoyo: true,
      duration: 0.16,
      ease: "power2.inOut",
    },
  );
}

export function shake(element) {
  if (!element) {
    return;
  }

  gsap.fromTo(
    element,
    {
      x: -6,
    },
    {
      x: 6,
      repeat: 5,
      yoyo: true,
      duration: 0.05,
      ease: "power1.inOut",
      onComplete: () => {
        gsap.set(element, { x: 0 });
      },
    },
  );
}

export function showMessage(element) {
  if (!element) {
    return;
  }

  element.classList.remove("hidden");

  gsap.fromTo(
    element,
    {
      opacity: 0,
      y: -8,
    },
    {
      opacity: 1,
      y: 0,
      duration: 0.3,
      ease: "power2.out",
    },
  );
}

export function hideMessage(element) {
  if (!element) {
    return;
  }

  gsap.to(element, {
    opacity: 0,
    y: -8,
    duration: 0.2,
    ease: "power2.in",
    onComplete: () => {
      element.classList.add("hidden");
    },
  });
}
