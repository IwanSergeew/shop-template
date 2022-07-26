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
    perPage: 4,
    autoScroll: 0
});