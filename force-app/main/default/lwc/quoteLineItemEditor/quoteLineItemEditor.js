import { LightningElement, api, wire, track } from 'lwc';
import getQuoteLineItems from '@salesforce/apex/QuoteLineItemController.getQuoteLineItems';
import updateQuoteLineItems from '@salesforce/apex/QuoteLineItemController.updateQuoteLineItems';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';

const COLUMNS = [
    {
        label: 'Product Name',
        type: 'button',
        typeAttributes: {
            label: { fieldName: 'ProductName' },
            name: 'navigateToQLI',
            variant: 'base'
        }
    },
    { label: 'Quantity', fieldName: 'Quantity', type: 'number', editable: true },
    { label: 'Unit Price', fieldName: 'UnitPrice', type: 'currency', editable: true },
    { label: 'Discount (%)', fieldName: 'Discount', type: 'number', editable: true },
    { label: 'Description', fieldName: 'Description', type: 'text', editable: true }
];

export default class QuoteLineItemEditor extends NavigationMixin(LightningElement) {
    @api recordId; // Quote ID
    @track quoteLineItems = [];
    @track draftValues = [];
    @track wiredResult;

    columns = COLUMNS;

    @wire(getQuoteLineItems, { quoteId: '$recordId' })
    wiredItems(result) {
        this.wiredResult = result;

        if (result.data) {
            this.quoteLineItems = result.data.map(row => ({
                Id: row.Id,
                ProductName: row.Product2?.Name,
                Quantity: row.Quantity,
                UnitPrice: row.UnitPrice,
                Discount: row.Discount,
                Description: row.Description
            }));
        } else if (result.error) {
            console.error('Error fetching QLIs:', result.error);
        }
    }

    handleSave(event) {
        const updatedFields = event.detail.draftValues;

        updateQuoteLineItems({ items: updatedFields })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Quote Line Items updated successfully',
                        variant: 'success'
                    })
                );
                this.draftValues = [];

                return refreshApex(this.wiredResult);
            })
            .then(() => {
                // Reload the window after refreshApex completes
                window.location.reload();
            })
            .catch(error => {
                console.error('Error updating QLIs:', error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Failed to update quote line items',
                        variant: 'error'
                    })
                );
            });
    }


    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;

        if (action.name === 'navigateToQLI') {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: row.Id, // QLI ID
                    objectApiName: 'QuoteLineItem',
                    actionName: 'view'
                }
            });
        }
    }
}