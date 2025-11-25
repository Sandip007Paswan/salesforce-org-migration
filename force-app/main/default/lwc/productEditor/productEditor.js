import { LightningElement, api, track } from 'lwc';
import addProductsToOpportunity from '@salesforce/apex/ProductSelectorController.addProductsToOpportunity';

const COLUMNS = [
    { label: 'Product', fieldName: 'Product2Name' },
    { label: 'Product Code', fieldName: 'ProductCode' },
    { label: 'Unit Price', fieldName: 'UnitPrice', type: 'currency' },
    { label: 'Quantity', fieldName: 'Quantity', type: 'number', editable: true },
    { label: 'Discount (%)', fieldName: 'Discount', type: 'number', editable: true },
    { label: 'Line Description', fieldName: 'Description', type: 'text', editable: true }
];

export default class ProductEditor extends LightningElement {
    @api selectedProducts = [];
    @api opportunityId;
    @track editableProducts = [];
    @track draftValues = [];
    columns = COLUMNS;

    connectedCallback() {
        this.editableProducts = this.selectedProducts.map(p => ({
            Id: p.Id,
            Product2Name: p.Product2Name,
            ProductCode: p.ProductCode,
            UnitPrice: p.UnitPrice,
            Quantity: 1,
            Discount: 0,
            Description: ''
        }));
    }

    handleSaveDrafts(event) {
        this.draftValues = event.detail.draftValues;
    }

    handleSave() {
        const items = this.draftValues.map(d => {
            const base = this.editableProducts.find(p => p.Id === d.Id);
            return {
                OpportunityId: this.opportunityId,
                PricebookEntryId: base.Id,
                Quantity: d.Quantity || 1,
                UnitPrice: base.UnitPrice,
                Discount: d.Discount || 0,
                Description: d.Description || ''
            };
        });

        addProductsToOpportunity({ opportunityId: this.opportunityId, items })
            .then(() => {
                this.dispatchEvent(new CustomEvent('close'));
            })
            .catch(error => {
                console.error(error);
            });
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }
}