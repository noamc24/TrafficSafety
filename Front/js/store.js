document.addEventListener("DOMContentLoaded", () => {
  const filterButtons = document.querySelectorAll(".store-filter-btn");
  const productItems = document.querySelectorAll(".product-item");
  const emptyState = document.getElementById("emptyState");

  if (!filterButtons.length || !productItems.length || !emptyState) return;

  productItems.forEach((item) => {
    const productId = item.dataset.productId;
    const detailsLink = item.querySelector(".product-card__btn");
    if (productId && detailsLink) {
      detailsLink.setAttribute("href", `/pages/product.html?id=${encodeURIComponent(productId)}`);
    }
  });

  function filterProducts(selectedFilter) {
    let visibleCount = 0;

    productItems.forEach((item) => {
      const itemCategory = item.dataset.category;

      if (selectedFilter === "all" || itemCategory === selectedFilter) {
        item.classList.remove("d-none");
        visibleCount++;
      } else {
        item.classList.add("d-none");
      }
    });

    if (visibleCount === 0) {
      emptyState.classList.remove("d-none");
    } else {
      emptyState.classList.add("d-none");
    }
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedFilter = button.dataset.filter;

      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      filterProducts(selectedFilter);
    });
  });
});
