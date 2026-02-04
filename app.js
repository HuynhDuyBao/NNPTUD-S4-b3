// RESTful API Endpoints
// GET    /api/v1/products       - Danh sách sản phẩm
// POST   /api/v1/products       - Tạo sản phẩm
// PUT    /api/v1/products/{id}  - Cập nhật sản phẩm

const API_URL = 'https://api.escuelajs.co/api/v1/products';

class ProductDashboard {
    constructor() {
        this.allProducts = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.sortField = null;
        this.sortOrder = 'asc';
        this.currentEditingId = null;

        this.initElements();
        this.bindEvents();
        this.loadProducts();
    }

    initElements() {
        this.searchInput = document.getElementById('searchInput');
        this.pageSizeSelect = document.getElementById('pageSizeSelect');
        this.tableBody = document.getElementById('tableBody');
        this.paginationContainer = document.getElementById('paginationContainer');
        this.recordCount = document.getElementById('recordCount');
        this.createBtn = document.getElementById('createBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.detailModal = new bootstrap.Modal(document.getElementById('detailModal'));
        this.formModal = new bootstrap.Modal(document.getElementById('formModal'));
        this.editBtn = document.getElementById('editBtn');
        this.submitBtn = document.getElementById('submitBtn');
        this.productForm = document.getElementById('productForm');
        this.titleSort = document.getElementById('titleSort');
        this.priceSort = document.getElementById('priceSort');
        this.successMessage = document.getElementById('successMessage');
    }

    bindEvents() {
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.pageSizeSelect.addEventListener('change', (e) => this.handlePageSizeChange(e.target.value));
        this.createBtn.addEventListener('click', () => this.openCreateModal());
        this.exportBtn.addEventListener('click', () => this.exportToCSV());
        this.editBtn.addEventListener('click', () => this.openEditModal());
        this.submitBtn.addEventListener('click', () => this.saveProduct());
        this.titleSort.addEventListener('click', () => this.sortBy('title'));
        this.priceSort.addEventListener('click', () => this.sortBy('price'));
    }

    async loadProducts() {
        try {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="loading">
                        <div class="spinner-border" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p style="margin-top: 15px;">Đang tải dữ liệu...</p>
                    </td>
                </tr>
            `;

            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Lỗi tải dữ liệu');

            this.allProducts = await response.json();
            this.filteredProducts = [...this.allProducts];
            this.currentPage = 1;
            this.render();
        } catch (error) {
            console.error('Lỗi:', error);
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="bi bi-exclamation-circle" style="font-size: 2rem; color: #dc3545;"></i>
                        <p style="margin-top: 10px;">Không thể tải dữ liệu từ API</p>
                    </td>
                </tr>
            `;
        }
    }

    handleSearch(value) {
        const searchTerm = value.toLowerCase();
        this.filteredProducts = this.allProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm)
        );
        this.currentPage = 1;
        this.render();
    }

    handlePageSizeChange(size) {
        this.pageSize = parseInt(size);
        this.currentPage = 1;
        this.render();
    }

    sortBy(field) {
        if (this.sortField === field) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortOrder = 'asc';
        }

        this.filteredProducts.sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];

            if (field === 'price') {
                aVal = parseFloat(aVal);
                bVal = parseFloat(bVal);
            } else if (field === 'title') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return this.sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        this.currentPage = 1;
        this.render();
        this.updateSortIcons();
    }

    updateSortIcons() {
        document.querySelectorAll('.sort-icon').forEach(icon => icon.textContent = '');
        if (this.sortField === 'title') {
            document.querySelector('#titleSort .sort-icon').textContent =
                this.sortOrder === 'asc' ? '▲' : '▼';
        } else if (this.sortField === 'price') {
            document.querySelector('#priceSort .sort-icon').textContent =
                this.sortOrder === 'asc' ? '▲' : '▼';
        }
    }

    render() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageData = this.filteredProducts.slice(start, end);

        this.renderTable(pageData);
        this.renderPagination();
        this.updateRecordCount();
    }

    renderTable(data) {
        if (data.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-data">
                        <i class="bi bi-inbox" style="font-size: 2rem; color: #999;"></i>
                        <p style="margin-top: 10px;">Không có dữ liệu để hiển thị</p>
                    </td>
                </tr>
            `;
            return;
        }

        this.tableBody.innerHTML = data.map(product => {
            const images = Array.isArray(product.images) ? product.images : [product.images];
            const image = images[0] || 'https://via.placeholder.com/100?text=No+Image';
            const category = product.category ? (typeof product.category === 'object' ? product.category.name : product.category) : 'N/A';
            const description = (product.description || 'Không có mô tả').replace(/"/g, '&quot;');

            return `
                <tr class="description-row" data-product-id="${product.id}" data-description="${description}">
                    <td class="id-cell">#${product.id}</td>
                    <td class="title-cell">${this.escapeHtml(product.title)}</td>
                    <td class="price-cell">$${parseFloat(product.price).toFixed(2)}</td>
                    <td><span class="category-cell">${this.escapeHtml(category)}</span></td>
                    <td>
                        <img src="${image}" alt="${product.title}" class="image-cell" 
                             onerror="this.src='https://via.placeholder.com/100?text=No+Image'">
                    </td>
                </tr>
            `;
        }).join('');

        this.tableBody.querySelectorAll('tr').forEach(row => {
            row.addEventListener('click', () => this.openDetailModal(row.dataset.productId));
        });
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
        if (totalPages <= 1) {
            this.paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '<nav aria-label="Page navigation"><ul class="pagination">';

        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="dashboard.goToPage(${this.currentPage - 1}); return false;">
                    Trước
                </a>
            </li>
        `;

        // Page numbers
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="dashboard.goToPage(1); return false;">1</a>
                </li>
            `;
            if (startPage > 2) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${this.currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="dashboard.goToPage(${i}); return false;">${i}</a>
                </li>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="dashboard.goToPage(${totalPages}); return false;">${totalPages}</a>
                </li>
            `;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="dashboard.goToPage(${this.currentPage + 1}); return false;">
                    Tiếp
                </a>
            </li>
        `;

        paginationHTML += '</ul></nav>';
        this.paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    updateRecordCount() {
        const total = this.filteredProducts.length;
        const start = (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(this.currentPage * this.pageSize, total);
        this.recordCount.textContent = `Hiển thị ${start} đến ${end} của ${total} bản ghi`;
    }

    async openDetailModal(productId) {
        const product = this.allProducts.find(p => p.id === parseInt(productId));
        if (!product) return;

        const images = Array.isArray(product.images) ? product.images : [product.images];
        const image = images[0] || 'https://via.placeholder.com/300?text=No+Image';
        const category = product.category ? (typeof product.category === 'object' ? product.category.name : product.category) : 'N/A';

        const detailModalBody = document.getElementById('detailModalBody');
        detailModalBody.innerHTML = `
            <div>
                <img src="${image}" alt="${product.title}" style="max-width: 100%; max-height: 400px; object-fit: contain; margin-bottom: 20px;"
                     onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
                <p><strong>ID:</strong> #${product.id}</p>
                <p><strong>Tiêu đề:</strong> ${this.escapeHtml(product.title)}</p>
                <p><strong>Giá:</strong> <span style="color: #28a745; font-weight: bold;">$${parseFloat(product.price).toFixed(2)}</span></p>
                <p><strong>Danh mục:</strong> ${this.escapeHtml(category)}</p>
                <p><strong>Mô tả:</strong></p>
                <p>${this.escapeHtml(product.description || 'Không có mô tả')}</p>
            </div>
        `;

        this.currentEditingId = product.id;
        this.detailModal.show();
    }

    openCreateModal() {
        document.getElementById('formModalTitle').textContent = 'Tạo sản phẩm mới';
        this.productForm.reset();
        this.clearFormErrors();
        this.currentEditingId = null;
        this.editBtn.style.display = 'none';
        this.formModal.show();
    }

    openEditModal() {
        if (!this.currentEditingId) return;

        const product = this.allProducts.find(p => p.id === this.currentEditingId);
        if (!product) return;

        document.getElementById('formModalTitle').textContent = 'Chỉnh sửa sản phẩm';
        document.getElementById('productTitle').value = product.title;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value =
            typeof product.category === 'object' ? product.category.name : product.category;
        document.getElementById('productDescription').value = product.description || '';

        const images = Array.isArray(product.images) ? product.images[0] : product.images;
        document.getElementById('productImage').value = images || '';

        this.clearFormErrors();
        this.detailModal.hide();
        this.formModal.show();
    }

    async saveProduct() {
        if (!this.validateForm()) return;

        const formData = {
            title: document.getElementById('productTitle').value,
            price: parseFloat(document.getElementById('productPrice').value),
            category: document.getElementById('productCategory').value,
            description: document.getElementById('productDescription').value,
            image: document.getElementById('productImage').value,
            images: [document.getElementById('productImage').value]
        };

        this.submitBtn.disabled = true;
        this.submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang lưu...';

        try {
            let response;
            if (this.currentEditingId) {
                // Update existing product
                response = await fetch(`${API_URL}/${this.currentEditingId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                // Create new product
                response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
            }

            if (!response.ok) throw new Error('Lỗi lưu sản phẩm');

            const result = await response.json();

            if (this.currentEditingId) {
                const index = this.allProducts.findIndex(p => p.id === this.currentEditingId);
                if (index !== -1) {
                    this.allProducts[index] = result;
                }
                this.showSuccess('Cập nhật sản phẩm thành công!');
            } else {
                this.allProducts.push(result);
                this.showSuccess('Tạo sản phẩm mới thành công!');
            }

            this.formModal.hide();
            this.handleSearch(this.searchInput.value);
        } catch (error) {
            console.error('Lỗi:', error);
            alert('Lỗi: ' + error.message);
        } finally {
            this.submitBtn.disabled = false;
            this.submitBtn.innerHTML = 'Lưu';
        }
    }

    validateForm() {
        let isValid = true;
        this.clearFormErrors();

        const title = document.getElementById('productTitle').value.trim();
        if (!title) {
            document.getElementById('titleError').textContent = 'Tiêu đề không được để trống';
            isValid = false;
        } else if (title.length < 3) {
            document.getElementById('titleError').textContent = 'Tiêu đề phải tối thiểu 3 ký tự';
            isValid = false;
        }

        const price = parseFloat(document.getElementById('productPrice').value);
        if (!price || price <= 0) {
            document.getElementById('priceError').textContent = 'Giá phải lớn hơn 0';
            isValid = false;
        }

        const category = document.getElementById('productCategory').value.trim();
        if (!category) {
            document.getElementById('categoryError').textContent = 'Danh mục không được để trống';
            isValid = false;
        }

        const description = document.getElementById('productDescription').value.trim();
        if (!description) {
            document.getElementById('descriptionError').textContent = 'Mô tả không được để trống';
            isValid = false;
        } else if (description.length < 10) {
            document.getElementById('descriptionError').textContent = 'Mô tả phải tối thiểu 10 ký tự';
            isValid = false;
        }

        const image = document.getElementById('productImage').value.trim();
        if (!image) {
            document.getElementById('imageError').textContent = 'URL hình ảnh không được để trống';
            isValid = false;
        } else if (!this.isValidUrl(image)) {
            document.getElementById('imageError').textContent = 'URL hình ảnh không hợp lệ';
            isValid = false;
        }

        return isValid;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    clearFormErrors() {
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    }

    exportToCSV() {
        const headers = ['ID', 'Tiêu đề', 'Giá', 'Danh mục', 'Mô tả'];
        const rows = this.filteredProducts.map(product => {
            const category = product.category ? (typeof product.category === 'object' ? product.category.name : product.category) : 'N/A';
            return [
                product.id,
                `"${product.title}"`,
                product.price,
                `"${category}"`,
                `"${product.description || ''}"`
            ];
        });

        let csv = headers.join(',') + '\n';
        csv += rows.map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `products_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showSuccess('Xuất CSV thành công!');
    }

    showSuccess(message) {
        this.successMessage.innerHTML = `
            <div class="success-message">
                <i class="bi bi-check-circle"></i> ${message}
            </div>
        `;
        setTimeout(() => {
            this.successMessage.innerHTML = '';
        }, 3000);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new ProductDashboard();
});
