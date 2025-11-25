import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getUserDocuments from '@salesforce/apex/ShobhaProjectController.getUserDocuments';
import createDocumentRecord from '@salesforce/apex/ShobhaProjectController.createDocumentRecord';
import LOGO from '@salesforce/resourceUrl/logo';

export default class RSDocumentUploader extends LightningElement {
    @track documents = [];
    @track documentType = '';
    @track expiryDate = '';
    @track isLoading = false;

    connectedCallback() {
        this.loadDocuments();
    }
    get logoUrl() {
    return LOGO;
}

    get isExpiryRequired() {
        return ['Passport', 'Driving License'].includes(this.documentType);
    }
    get documentTypeClass() {
        return !this.documentType && this.validationAttempted ? 'slds-has-error' : '';
    }


    get expiryDateClass() {
        return this.isExpiryRequired && !this.expiryDate && this.validationAttempted ? 'slds-has-error' : '';
    }

    get documentOptions() {
        return [
            { label: 'Aadhar', value: 'Aadhar' },
            { label: 'PAN', value: 'PAN' },
            { label: 'Passport', value: 'Passport' },
            { label: 'Driving License', value: 'Driving License' },
            { label: 'Voter ID', value: 'Voter ID' },
            { label: 'Sale Agreement', value: 'Sale Agreement' },
            { label: 'RERA Cert', value: 'RERA Cert' },
            { label: 'NOC', value: 'NOC' },
            { label: 'Other', value: 'Other' }
        ];
    }

 loadDocuments() {
    this.isLoading = true;
    getUserDocuments()
        .then(result => {
            
            this.documents = result.map(doc => ({
                ...doc,
                downloadUrl: doc.DownloadUrl,
                previewUrl: doc.PreviewUrl
            }));

            console.debug('📂 Loaded Documents:', JSON.stringify(this.documents, null, 2));
        })
        .catch(error => {
            this.showToast('Error loading documents', error.body.message, 'error');
        })
        .finally(() => {
            this.isLoading = false;
        });
}



    handleTypeChange(event) {
        this.documentType = event.detail.value;
        if (!this.isExpiryRequired) {
            this.expiryDate = '';
        }
    }

    handleDateChange(event) {
        this.expiryDate = event.detail.value;
    }

    handleUploadFinished(event) {
        const uploadedFile = event.detail.files[0];
        const contentDocumentId = uploadedFile.documentId;

        console.debug('📂 Uploaded file object:', JSON.stringify(uploadedFile, null, 2));
        console.debug('📄 Document Type:', this.documentType);
        console.debug('📅 Expiry Date:', this.expiryDate);
        console.debug('📌 Is Expiry Required:', this.isExpiryRequired);

        if (!this.documentType || (this.isExpiryRequired && !this.expiryDate)) {
            this.validationAttempted = true;
            this.showToast(
                'Missing Data',
                'Please select document type' + (this.isExpiryRequired ? ' and expiry date' : '') + ' before uploading.',
                'warning'
            );
            return;
        }


        this.isLoading = true;

        createDocumentRecord({
            fileName: uploadedFile.name,
            documentType: this.documentType,
            expiryDate: this.isExpiryRequired ? this.expiryDate : null,
            contentDocumentId: contentDocumentId
        })
            .then(() => {
                this.showToast('Success', 'Document uploaded successfully.', 'success');
                this.loadDocuments();
                this.documentType = '';
                this.expiryDate = '';
            })
            .catch(error => {
                console.error('❌ Upload Error:', error);
                this.showToast('Upload Error', error.body?.message || error.message || 'Unknown error', 'error');
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}