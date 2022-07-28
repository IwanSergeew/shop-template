class ProductsFilter {
    constructor({
        selector,
        ajax,
        perPage = 20,
        filters = {
            searchBar: true
        }
    }) {
        if(!selector) return console.error('Invalid selector provided');
        this.el = typeof(selector) == 'string' ? document.querySelector(selector) : selector;
        if(ajax) {
            if(typeof(ajax) == 'string') this.ajaxUrl = ajax;
            else {
                this.ajaxUrl = ajax.url || null;
                if(ajax.method && ajax.method != 'POST' && ajax.method != 'GET') return console.error(`Invalid ajax method given.`);
                this.ajaxMethod = (ajax.method && (ajax.method == 'POST' || ajax.method == 'GET')) ? ajax.method : 'POST';
            }
        }
        this.page = 0;
        this.perPage = perPage;
        this.orderby = 0;
        this.order_direction = 'ASC';
        this.searchText = '';
        this.category = '';
        this.filters = filters;

        Array.from(this.el.querySelectorAll('ul.filter-menu li[data-category]')).forEach(e => {
            e.addEventListener('click', this.categoryClickEvent);
        });

        this.createFilterOptions();

        this.getProductsData();
    }

    getProductsData = async () => {
        try {
            const response = await fetch(this.ajaxUrl, { method: this.ajaxMethod });
            if(!response) throw 'No data recieved from request.';
            this.data = await response.json();
            if(!this.data?.length) this.noDataFound();
            else {
                this.appendProducts();
                this.addPagination();
            }
            if(this.initComplete && typeof(this.initComplete) == 'function') this.initComplete();
        }
        catch(err) {
            if(this.error && typeof(this.error) == 'function') this.error(err);
            else console.error(err);
        }
    }

    noDataFound = () => {
        const container = this.el.querySelector('.products-container');
        container.innerHTML = 'No products found.';
    }

    createFilterOptions = () => {
        const container = document.createElement('div');
        container.classList = 'filter-options';
        const menuBtn = document.createElement('div');
        menuBtn.classList = 'menu-btn';
        menuBtn.innerHTML = '=';
        menuBtn.addEventListener('click', this.mobileFilterMenuToggle);
        container.append(menuBtn);
        if(this.filters.searchBar) {
            const searchBarEl = document.createElement('input');
            searchBarEl.type = 'text';
            searchBarEl.classList = 'search-filter';
            searchBarEl.placeholder = 'Search...';
            searchBarEl.addEventListener('keyup', (e) => {
                if(this.searchTimeout) clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(this.searchFilterChange, 200, e);
            });
            container.append(searchBarEl);
        }
        this.el.prepend(container);
    }

    searchFilterChange = (e) => {
        this.searchTimeout = null;
        this.searchText = e.target.value;
        this.appendProducts();
    }

    mobileFilterMenuToggle = (e) => {
        this.el.querySelector('ul.filter-menu').classList.toggle('open');
    }

    categoryClickEvent = (e) => {
        this.el.querySelector('ul.filter-menu li[data-category].active').classList.remove('active');
        e.currentTarget.classList.add('active');
        const category = e.currentTarget.dataset.category;
        this.category = category;
        this.appendProducts();
    }

    appendProducts = () => {
        this.filterData();
        if(!this.filteredData.length) {
            this.noDataFound();
            return;
        }
        const container = this.el.querySelector('.products-container');
        container.innerHTML = '';
        let a, imageContainer, img, name, rating, y, hy, b;
        for(let i = (this.page * this.perPage); i < ((this.page + 1) * this.perPage); i++) {
            if(i >= this.filteredData.length) break;
            a = document.createElement('a');
            a.classList = 'product-wrapper';
            a.href = `products?id=${this.filteredData[i]['id']}`;
            imageContainer = document.createElement('div');
            imageContainer.classList = 'product-image';
            img = document.createElement('img');
            img.src = this.filteredData[i]['image'];
            img.alt = 'Product Image';
            name = document.createElement('span');
            name.classList = 'product-name';
            name.innerHTML = this.filteredData[i]['name'];
            rating = document.createElement('span');
            rating.classList = 'product-rating';
            [y, hy, b] = this.getRateStars(this.filteredData[i]['rating']);
            rating.innerHTML = '<span class="yellow">' + '★'.repeat(y) + '</span>' + (hy ? '<span class="half-yellow">★</span>' : '') + '★'.repeat(b);

            imageContainer.append(img);
            a.append(imageContainer);
            a.append(name);
            a.append(rating);
            container.append(a);
        }
    }

    addPagination = () => {

    }

    getRateStars(n){
        const nInt = parseInt(n);
        if(nInt == n) return [nInt, 0, 5-n];
        const decimal = parseInt((n % 1) * 100);
        if(decimal < 25) return [nInt-1, 0, 5-(nInt - 1)];
        if(decimal > 75) return [nInt, 0, 5-nInt];
        return [nInt-1, 1, 5-nInt];
    }

    filterData = () => {
        this.filteredData = this.data.filter(v => 
            (!this.category || v.category == this.category) &&
            (this.searchText.length == 0 || v.name.toLowerCase().includes(this.searchText.toLowerCase()))
        );
    }
}