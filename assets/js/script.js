const heroCarousel = new Carousel({
    selector: '#heroCarousel',
    transitionSpeed: 300,
    draggable: true,
    dragSens: 1.5,
    loop: true,
    perPage: 1,
    autoScroll: 10
});

const randomCarousel = new Carousel({
    selector: '#randomCarousel',
    transitionSpeed: 300,
    draggable: true,
    dragSens: 1.5,
    snapOnDrag: false,
    loop: true,
    perPage: [
        { maxwidth: 1080, items: 4 },
        { maxwidth: 700, items: 3 },
        { maxwidth: 400, items: 2 },
        { maxwidth: 300, items: 1 }
    ],
    autoScroll: 0
});

const homeProductsFilter = new ProductsFilter({
    selector: '#homeProductsFilter',
    ajax: {
        url: 'data/data-products.php',
        method: 'POST'
    }
});