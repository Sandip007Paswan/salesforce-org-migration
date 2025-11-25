import { LightningElement, api } from 'lwc';
import createRFQ from '@salesforce/apex/RaiseRFQController.createRFQ';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

export default class RaiseRfqButton extends NavigationMixin(LightningElement) {
    @api recordId;

    handleClick() {
        createRFQ({ leadId: this.recordId })
            .then(rfqId => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'RFQ created successfully.',
                        variant: 'success'
                    })
                );

                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: rfqId,
                        objectApiName: 'RFQ__c',
                        actionName: 'view'
                    }
                });
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }
}

// import { LightningElement, api } from 'lwc';
// import createRFQ from '@salesforce/apex/RaiseRFQController.createRFQ';
// import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// import { NavigationMixin } from 'lightning/navigation';

// export default class RaiseRfqButton extends NavigationMixin(LightningElement) {
//     @api recordId;

//     handleClick() {
//         createRFQ({ leadId: this.recordId })
//             .then(() => {
//                 this.dispatchEvent(
//                     new ShowToastEvent({
//                         title: 'Success',
//                         message: 'RFQ created successfully.',
//                         variant: 'success'
//                     })
//                 );

//                 // 🔁 Navigate to same Lead record to force page refresh
//                 this[NavigationMixin.Navigate]({
//                     type: 'standard__recordPage',
//                     attributes: {
//                         recordId: this.recordId,
//                         objectApiName: 'Lead',
//                         actionName: 'view'
//                     }
//                 });
//             })
//             .catch(error => {
//                 this.dispatchEvent(
//                     new ShowToastEvent({
//                         title: 'Error',
//                         message: error.body.message,
//                         variant: 'error'
//                     })
//                 );
//             });
//     }
// }