(function initProductsDataLoader() {
  let cachedPromise = null;

  window.loadProductsData = function loadProductsData() {
    if (!cachedPromise) {
      cachedPromise = fetch('/data/products.json', { cache: 'no-cache' })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load products catalog: ${response.status}`);
          }
          return response.json();
        });
    }

    return cachedPromise;
  };
})();
