import { LightningElement, api, wire, track } from 'lwc';
import getAvailableProducts from '@salesforce/apex/OpportunityProductController.getAvailableProducts';
import addOpportunityProduct from '@salesforce/apex/OpportunityProductController.addOpportunityProduct';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class OpportunityProductEntry extends LightningElement {
    @api recordId; // Opportunity Id
    @track productOptions = [];
    selectedProductId = '';
    quantity = 1;
    salesPrice = 0;
    discount = 0;

    @wire(getAvailableProducts, { pricebookId: '01sKY000000UQyqYAG' }) // Replace with your Pricebook2 ID
    wiredProducts({ data, error }) {
        if (data) {
            this.productOptions = data.map(prod => ({
                label: prod.Product2.Name,
                value: prod.Id
            }));
        } else if (error) {
            this.showToast('Error loading products', error.body.message, 'error');
        }
    }

    handleProductChange(event) {
        this.selectedProductId = event.detail.value;
    }

    handleQuantityChange(event) {
        this.quantity = event.detail.value;
    }

    handleSalesPriceChange(event) {
        this.salesPrice = event.detail.value;
    }

    handleDiscountChange(event) {
        this.discount = event.detail.value;
    }

    handleAddProduct() {
        addOpportunityProduct({
            opportunityId: this.recordId,
            pricebookEntryId: this.selectedProductId,
            quantity: this.quantity,
            unitPrice: this.salesPrice,
            discount: this.discount
        })
        .then(() => {
            this.showToast('Success', 'Product added to Opportunity.', 'success');
        })
        .catch(error => {
            this.showToast('Error', error.body.message, 'error');
        });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    }
}