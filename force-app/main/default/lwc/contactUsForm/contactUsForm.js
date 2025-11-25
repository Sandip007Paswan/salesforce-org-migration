import { LightningElement, track } from 'lwc';

export default class ContactUsForm extends LightningElement {
    recordId = null;
    acceptedFormats = ['.pdf', '.png', '.jpg', '.docx'];

    @track showSuccess = false;
    @track createdCaseId;

    handleSuccess(event) {
        this.createdCaseId = event.detail.id;
        this.showSuccess = true;

        // Optional: hide message after 5 seconds
        setTimeout(() => {
            this.showSuccess = false;
        }, 5000);
    }
}