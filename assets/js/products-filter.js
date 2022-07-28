class ProductsFilter {
    constructor({
        selector,
        ajax
    }) {
        if(!selector) return console.error('Invalid selector provided');
        this.el = typeof(selector) == 'string' ? document.querySelector(selector) : selector;
        this.category = '';
        if(ajax) {
            if(typeof(ajax) == 'string') this.ajaxUrl = ajax;
            else {
                this.ajaxUrl = ajax.url || null;
                if(ajax.method && ajax.method != 'POST' && ajax.method != 'GET') return console.error(`Invalid ajax method given.`);
                this.ajaxMethod = ajax.method || 'POST';
                this.dataSrc = ajax.dataSrc || '';
            }
        }

        Array.from(this.el.querySelectorAll('ul.filter-menu li[data-category]')).forEach(e => {
            e.addEventListener('click', this.categoryClickEvent);
        });
        this.el.querySelector('.menu-btn').addEventListener('click', this.mobileFilterMenuToggle);

        this.createFilterOptions();

        this.getProductsData();
    }

    getProductsData = async () => {
        console.log('here');
        try {
            let response;
            if(!this.ajaxMethod || this.ajaxMethod == 'POST') {
                const fd = new FormData();
                fd.append('page', this.page);
                fd.append('limit', this.perPage);
                fd.append('orderby', this.orderby);
                fd.append('order_direction', this.order_direction);
                fd.append('search_text', this.searchText);

                response = await fetch(this.ajaxUrl, {
                    method: 'POST',
                    body: fd
                });
            }
            else {
                response = await fetch(this.ajaxUrl + '?' + new URLSearchParams({
                    page: this.page,
                    limit: this.perPage,
                    orderby: this.orderby,
                    order_direction: this.order_direction,
                    searchText: this.searchText,
                }), {
                    method: 'GET'
                });
            }
            if(!response) throw 'No data recieved from request.';
            const json = await response.json();
            const data = (this.dataSrc && this.dataSrc.length > 0) ? json[0][this.dataSrc] : json[0];
            this.totalItems = data.total_rows;
            if(!this.totalItems) this.noDataFound();
            else {
                this.appendProducts(data.data);
                this.addPagination();
            }
            if(this.initComplete && typeof(this.initComplete) == 'function') this.initComplete({
                data: data.data,
                total_rows: data.total_rows
            });
        }
        catch(err) {
            if(this.error && typeof(this.error) == 'function') this.error(err);
            else console.error(err);
        }
    }

    noDataFound = () => {

    }

    createFilterOptions = () => {
        const container = document.createElement('div');
        container.classList = 'filter-options';
        this.el.prepend(container);
    }

    mobileFilterMenuToggle = (e) => {
        this.el.querySelector('ul.filter-menu').classList.toggle('open');
    }

    categoryClickEvent = (e) => {
        this.el.querySelector('ul.filter-menu li[data-category].active').classList.remove('active');
        e.currentTarget.classList.add('active');
        const category = e.currentTarget.dataset.category;
        this.category = category;
    }

    appendProducts = () => {

    }
}