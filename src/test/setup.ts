import "@testing-library/jest-dom/vitest";

// Mock ResizeObserver (not available in jsdom)
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock;

// Mock scrollTo
window.scrollTo = () => {};

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
  root = null;
  rootMargin = "";
  thresholds = [];
  takeRecords = () => [];
}
window.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
