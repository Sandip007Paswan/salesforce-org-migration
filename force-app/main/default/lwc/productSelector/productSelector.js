import { LightningElement, track, wire, api } from 'lwc';
import getProducts from '@salesforce/apex/ProductSelectorController.getProducts';

const COLUMNS = [
    { label: 'Product Name', fieldName: 'Product2Name' },
    { label: 'Product Code', fieldName: 'ProductCode' },
    { label: 'Unit Price', fieldName: 'UnitPrice', type: 'currency' },
];

export default class ProductSelector extends LightningElement {
    @api pricebookId;
    @api opportunityId;
    @track isModalOpen = false;
    @track products = [];
    @track selectedProductIds = [];
    @track selectedProducts = [];
    @track searchKey = '';
    @track showEditor = false;

    @track columns = COLUMNS;

    openModal() {
        this.isModalOpen = true;
        getProducts({ pricebookId: this.pricebookId })
            .then(result => {
                this.products = result.map(row => ({
                    Id: row.Id,
                    Name: row.Product2.Name,
                    Product2Name: row.Product2.Name,
                    ProductCode: row.ProductCode,
                    UnitPrice: row.UnitPrice
                }));
            });
    }

    closeModal() {
        this.isModalOpen = false;
        this.showEditor = false;
    }

    handleSearch(event) {
        this.searchKey = event.target.value;
        this.products = this.products.filter(p => p.Product2Name.toLowerCase().includes(this.searchKey.toLowerCase()));
    }

    handleRowSelection(event) {
        this.selectedProductIds = event.detail.selectedRows.map(row => row.Id);
        this.selectedProducts = event.detail.selectedRows;
    }

    goToNext() {
        if (this.selectedProducts.length > 0) {
            this.isModalOpen = false;
            this.showEditor = true;
        }
    }
}