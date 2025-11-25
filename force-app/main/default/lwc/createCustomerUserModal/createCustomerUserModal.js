import { LightningElement, api, track } from 'lwc';
import getLicenseAndProfileOptions from '@salesforce/apex/UserController.getLicenseAndProfileOptions';
import createPortalUser from '@salesforce/apex/UserController.createPortalUser';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class UserCreationForm extends LightningElement {
    @api contactId; // passed from record page

    @track licenseOptions = [];
    @track profileOptions = [];

    selectedLicense = '';
    selectedProfile = '';

    firstName = '';
    lastName = '';
    email = '';
    username = '';
    alias = '';

    connectedCallback() {
        this.loadPicklists();
    }

    async loadPicklists() {
        try {
            const result = await getLicenseAndProfileOptions();
            this.licenseOptions = result.licenses;
            this.profileOptions = result.profiles;
        } catch (error) {
            this.showToast('Error loading options', error.body.message, 'error');
        }
    }

    handleChange(event) {
        const field = event.target.dataset.field;
        this[field] = event.detail.value;
    }

    handleLicenseChange(event) {
        this.selectedLicense = event.detail.value;
    }

    handleProfileChange(event) {
        this.selectedProfile = event.detail.value;
    }

    async handleSubmit() {
        if (!this.contactId) {
            this.showToast('Missing Contact', 'Contact ID is required', 'error');
            return;
        }

        try {
            await createPortalUser(
                this.contactId,
                this.email,
                this.username,
                this.selectedProfile,
                this.alias,
                this.firstName,
                this.lastName,
                this.selectedLicense
            );

            this.showToast('Success', 'User created and email sent.', 'success');
            this.resetForm();
        } catch (error) {
            this.showToast('Error creating user', error.body.message, 'error');
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    resetForm() {
        this.firstName = '';
        this.lastName = '';
        this.email = '';
        this.username = '';
        this.alias = '';
        this.selectedLicense = '';
        this.selectedProfile = '';
    }
}