class Carousel {
    constructor({
        selector,
        transitionSpeed = 300,
        transitionExtra = 'linear',
        draggable = true,
        dragSens = 1.5,
        snapOnDrag = true,
        loop = true,
        perPage = 2,
        autoScroll = 5
    }) {
        if(!selector) return console.error('Invalid carousel selector provided');
        this.carousel = typeof(selector) == 'string' ? document.querySelector(selector) : selector;
        if(!transitionSpeed || transitionSpeed < 1) return console.error('Transition Speed can not be less than 1');
        else this.transitionSpeed = transitionSpeed;
        this.transitionExtra = transitionExtra;
        this.track = this.carousel.querySelector('.carousel_track');
        this.track.style = 'transform: translateX(0px);';
        this.nextBtn = this.carousel.querySelector('.carousel_button-right');
        this.prevBtn = this.carousel.querySelector('.carousel_button-left');
        this.dotsNav = this.carousel.querySelector('.carousel_nav');
        this.loadingBar = this.carousel.querySelector('.loading-bar');
        this.autoScroll = autoScroll;
        this.dragSens = dragSens;
        this.snapOnDrag = snapOnDrag;
        this.loop = loop;
        this.perPage = perPage;
        this.lastMousePosX = null;
        this.autoScrollTimeOut = null;

        if(this.loadingBar) this.loadingBar.style.width = `0%`;

        if(this.snapOnDrag) this.track.children[0].classList.add('current_slide');

        // Check if buttons are set and add click event
        if(this.nextBtn) this.nextBtn.addEventListener('click', this.moveToNextSlide);
        if(this.prevBtn) this.prevBtn.addEventListener('click', this.moveToPrevSlide);
        
        // Get mouse events if draggable
        if(draggable) {
            window.addEventListener("mousemove", this.mouseMoveEvent);
            window.addEventListener("mouseup", this.mouseUpEvent);
            this.track.setAttribute('draggable', 'true');
            this.carousel.addEventListener('mousedown', this.mouseDownOnSlide);
        }

        this.setPerPageAmount();
        this.setItemsWidth();

        // Check if dots are set and add click event
        if(this.dotsNav) {
            const dotsNum = this.track.children.length;
            let dot;
            for(let i = 0; i < dotsNum; i++) {
                dot = document.createElement('button');
                if(i == 0) dot.classList.add('current_slide');
                this.dotsNav.append(dot);
                dot.addEventListener('click', this.dotNavClick);
            }
        }

        if(this.loop) this.addExtraFirstAndLast();

        this.setSlidesPosition();

        // Update slides width and position on window resize
        window.addEventListener("resize", (e) => {
            if(this.resizeTimeout) clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(this.windowResizeEvent, 200);
        });

        if(this.autoScroll) this.setAutoScrollTimeout();
    }

    setPerPageAmount = () => {
        if(typeof(this.perPage) == 'number') {
            this.perPageAmount = this.perPage;
            return;
        }

        const width = window.innerWidth;
        let index = this.perPage.findIndex(p => p.maxwidth < width);
        if(index < 0) index = this.perPage.length - 1;
        this.perPageAmount = this.perPage[index].items;
    }

    setItemsWidth = () => {
        this.itemWidth = this.track.getBoundingClientRect().width / this.perPageAmount;
        for(let i = 0; i < this.track.childElementCount; i++) {
            this.track.children[i].style.width = `${this.itemWidth}px`;
        }
    }

    windowResizeEvent = () => {
        this.resizeTimeout = null;
        this.setPerPageAmount();
        this.setItemsWidth();
        if(this.loop) this.addExtraFirstAndLast();
        this.setSlidesPosition();
        
        if(this.snapOnDrag) {
            const activeSlide = this.track.querySelector('.current_slide');
            const targetIndex = Array.from(this.track.children).findIndex(s => s == activeSlide);
            const translateX = this.convertTranslateX(this.track.children[targetIndex].style.transform);
            this.setCarouselPosition(translateX);
        }
    }

    setCarouselPosition = (position) => {
        const add = (this.perPageAmount % 2 && (this.track.childElementCount < this.perPageAmount)) ? true : false;
        if(position >= this.itemWidth) this.track.style.transform = `translateX(${(((this.track.childElementCount - (this.perPageAmount + (!add ? 2 : 1))) * this.itemWidth) * -1)}px)`;
        else if(position <= (((this.track.childElementCount - (this.perPageAmount + (!add ? 1 : 0))) * this.itemWidth) * -1)) this.track.style.transform = `translateX(0px)`;
        else this.track.style.transform = `translateX(${position}px)`;
    }

    snapClosestAfterDrag = () => {
        // Get current translate propperty value
        let translateX = this.convertTranslateX(this.track.style.transform);

        // Dragged before first element
        if(translateX > (this.itemWidth / 2)) {
            this.moveSlide(this.track.querySelector('.current_slide'), this.track.children[0]);
            return;
        }

        if(translateX < (((this.track.childElementCount - 2) * this.itemWidth) * -1)) {
            this.moveSlide(this.track.querySelector('.current_slide'), this.track.children[this.track.childElementCount - 2]);
            return;
        }

        // Convert to positive value
        if(translateX < 0) translateX *= -1;

        let closestChild = -1;
        let closestBy = null;
        let distance;

        // Find closest slider in track
        for(let i = 0; i < this.track.childElementCount; i++) {
            distance = this.convertTranslateX(this.track.children[i].style.transform) - translateX;
            if(distance < 0) distance *= -1;
            
            if(closestBy == null || distance < closestBy) {
                closestBy = distance;
                closestChild = i;
            }
        }

        // Move slider
        this.track.style.transition = `transform ${this.transitionSpeed}ms ${this.transitionExtra}`;
        this.moveSlide(this.track.querySelector('.current_slide'), this.track.children[closestChild]);
    }

    convertTranslateX = (transform) => {
        const res = transform.match(/translateX\(([0-9\.?\-?]+(px|em|%|ex|ch|rem|vh|vw|vmin|vmax|mm|cm|in|pt|pc))\)/);
        return res ? Number(res[1].replace('px', '')) : 0;
    }

    // Move Slides Right function
    moveToNextSlide = () => {
        const currentSlide = this.track.querySelector('.current_slide');
        let nextSlide = currentSlide.nextElementSibling;
        if(!nextSlide) {
            this.track.style.transition = 'unset';
            this.setCarouselPosition(this.itemWidth);
            nextSlide = this.track.children[1];
        }
        this.track.style.transition = `transform ${this.transitionSpeed}ms ${this.transitionExtra}`;
        this.moveSlide(currentSlide, nextSlide);
    }
    // Move Slides Left function
    moveToPrevSlide = () => {
        const currentSlide = this.track.querySelector('.current_slide');
        let prevSlide = currentSlide.previousElementSibling;
        if(!prevSlide) {
            this.track.style.transition = 'unset';
            this.setCarouselPosition(((this.track.childElementCount - 2) * this.itemWidth) * -1);
            prevSlide = this.track.children[this.track.childElementCount - 3];
        }
        this.track.style.transition = `transform ${this.transitionSpeed}ms ${this.transitionExtra}`;
        this.moveSlide(currentSlide, prevSlide);
    }
    // Move slides on dot click
    dotNavClick = (e) => {
        const index = Array.from(this.dotsNav.children).findIndex(dot => dot == e.currentTarget);
        const currentSlide = this.track.querySelector('.current_slide');
        this.track.style.transition = `transform ${this.transitionSpeed}ms ${this.transitionExtra}`;
        this.moveSlide(currentSlide, this.track.children[index + 1]);
    }
    
    // Move Slide
    moveSlide = (current, target) => {
        clearTimeout(this.autoScrollTimeOut);
        this.autoScrollTimeOut = null;
        this.track.removeEventListener('transitionend', this.slideTransitionEnd);

        this.sameSlideTransition = (current == target);

        if(!this.sameSlideTransition) {
            if(this.loadingBar) {
                this.loadingBar.style.transition = `unset`;
                this.loadingBar.style.width = `0%`;
            }
            current.classList.remove('current_slide');
            target.classList.add('current_slide');
        }

        const targetTranslateX = this.convertTranslateX(target.style.transform);
        this.track.style.transform = `translateX(${targetTranslateX * -1}px)`;

        this.track.addEventListener('transitionend', this.slideTransitionEnd);
        
        if(this.dotsNav) this.updateDots();
    }

    slideTransitionEnd = (e) => {
        this.track.style.transition = 'unset';
        const currentSlide = this.track.querySelector('.current_slide');
        if(!currentSlide.nextElementSibling) {
            this.track.style.transform = `translateX(0px)`;
            this.track.querySelector('.current_slide').classList.remove('current_slide');
            this.track.children[1].classList.add('current_slide');
            if(this.dotsNav) this.updateDots();
        }
        else if(!currentSlide.previousElementSibling) {
            this.track.style.transform = `translateX(${((this.track.childElementCount - 3) * this.itemWidth) * -1}px)`;
            this.track.querySelector('.current_slide').classList.remove('current_slide');
            this.track.children[this.track.childElementCount - 2].classList.add('current_slide');
            if(this.dotsNav) this.updateDots();
        }

        if(this.autoScroll) this.setAutoScrollTimeout();
    }

    // Mouse down on track
    mouseDownOnSlide = (e) => {
        clearTimeout(this.autoScrollTimeOut);
        this.autoScrollTimeOut = null;
        e.preventDefault();

        if(this.loadingBar) {
            const computedStyle = window.getComputedStyle(this.loadingBar);
            this.loadingBar.style.width = computedStyle.getPropertyValue('width');
        }

        const translateX = this.convertTranslateX(this.track.style.transform);
        this.setCarouselPosition(translateX);
        this.lastMousePosX = e.screenX;
    }
    // Mouse move
    mouseMoveEvent = (e) => {
        if(this.lastMousePosX != null) {
            e.preventDefault();

            if(!e.target.classList.contains('carousel_container') && !e.target.closest('.carousel_container')) {
                this.mouseUpEvent(e);
                return;
            }
            
            const amount = (e.screenX - this.lastMousePosX) * this.dragSens;
            const translateX = this.convertTranslateX(this.track.style.transform);
            if(isNaN(translateX)) return;
            this.setCarouselPosition(translateX + amount);
            this.lastMousePosX = e.screenX;
            this.carousel.classList.add('dragging');
        }
    }
    // Mouse up
    mouseUpEvent = (e) => {
        if(this.lastMousePosX != null) {
            e.preventDefault();
            this.lastMousePosX = null;
            if(this.snapOnDrag) this.snapClosestAfterDrag();
            this.carousel.classList.remove('dragging');
        }
    }

    updateDots = (index = -1) => {
        if(index < 0) {
            const currentSlide = this.track.querySelector('.current_slide');
            index = Array.from(this.track.children).findIndex(el => el == currentSlide);
            index -= 1;
        }
        if(index < 0) index = this.dotsNav.childElementCount - 1;
        if(index >= this.dotsNav.childElementCount) index = 0;
        const currentSlide = this.dotsNav.querySelector('.current_slide');
        currentSlide?.classList?.remove('current_slide');
        this.dotsNav.children[index].classList.add('current_slide');
    }

    setSlidesPosition = () => {
        const slides = this.track.children;
        const remove = (this.loop && this.track.childElementCount > this.perPageAmount) ? 1 : 0;
        for(let i = 0; i < slides.length; i++) {
            slides[i].style.transform = `translateX(${this.itemWidth * (i-remove)}px)`;
        }
    }

    autoScrollFunc = () => {
        const currentSlide = this.track.querySelector('.current_slide');
        const targetSlide = currentSlide.nextElementSibling || this.track.children[1];
        this.track.style.transition = `transform ${this.transitionSpeed}ms ${this.transitionExtra}`;
        this.moveSlide(currentSlide, targetSlide);
    }

    setAutoScrollTimeout = () => {
        let time = 0;
        if(this.sameSlideTransition && this.loadingBar) {
            const trackWidth = this.track.getBoundingClientRect().width;
            const barWidth = this.loadingBar.getBoundingClientRect().width;
            const percent = barWidth / trackWidth;
            time = (this.autoScroll * 1000) - (percent * (this.autoScroll * 1000));
            this.loadingBar.style.transition = `width ${time}ms linear`;
            this.loadingBar.style.width = this.continueTransitionFrom;
            this.loadingBar.style.width = `100%`;
        }
        else {
            time = this.autoScroll * 1000;
            if(this.loadingBar) {
                this.loadingBar.style.transition = `width ${time}ms linear`;
                this.loadingBar.style.width = `100%`;
            }
        }
        
        if(this.autoScroll) this.autoScrollTimeOut = setTimeout(this.autoScrollFunc, time);
    }

    addExtraFirstAndLast = () => {
        let copyChild;
        while(copyChild = this.track.querySelector('.copy_slide')) { this.track.removeChild(copyChild) };
        
        const children = this.track.children;
        if(this.perPageAmount > 1) {
            const last = children[this.track.childElementCount-1].cloneNode(true);
            last.classList.remove('current_slide');
            last.classList.add('copy_slide');
            let clone;
            for(let i = 0; i < this.perPageAmount; i++) {
                clone = children[i].cloneNode(true);
                clone.classList.remove('current_slide');
                clone.classList.add('copy_slide');
                this.track.append(clone);
            }
            this.track.prepend(last);
        }
        else {
            const first = children[0].cloneNode(true);
            const last = children[this.track.childElementCount-1].cloneNode(true);
            first.classList.remove('current_slide');
            last.classList.remove('current_slide');
            first.classList.add('copy_slide');
            last.classList.add('copy_slide');
            this.track.append(first);
            this.track.prepend(last);
        }
    }
}

// window.addEventListener('DOMContentLoaded', (event) => {
//     const couraselElements = document.querySelectorAll('[data-carousel-html]');
//     if(couraselElements.length > 0)
//         couraselElements.forEach(e => new Carousel({
//             selector: e,

//         }));
// });