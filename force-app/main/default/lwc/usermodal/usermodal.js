import { LightningElement, api, track } from 'lwc';
import getLicenseAndProfileOptions from '@salesforce/apex/UserController.getLicenseAndProfileOptions';
import createPortalUser from '@salesforce/apex/UserController.createPortalUser';
import getContactDetails from '@salesforce/apex/UserController.getContactDetails';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LOGO from '@salesforce/resourceUrl/logo';
import { CloseActionScreenEvent } from 'lightning/actions';

export default class Usermodal extends LightningElement {
    @api recordId;
    contactId;

    @track licenseOptions = [];
    @track profileOptions = [];

    selectedLicense = '';
    selectedProfile = '';

    @track firstName = '';
    @track lastName = '';
    @track email = '';
    @track username = '';
    @track alias = '';


    connectedCallback() {
        // Use @api recordId if available (passed by parent or Lightning page)
        if (this.recordId) {
            this.contactId = this.recordId;
        } else {
            // Parse from URL
            const urlParams = new URLSearchParams(window.location.search);
            this.contactId = urlParams.get('recordId');
            console.log('Parsed contactId from URL:', this.contactId);
        }

        console.log('Connected Callback fired. contactId:', this.contactId);

        this.loadPicklists();
        this.loadContactData();
    }
    get logoUrl() {
        return LOGO;
    }


    async loadContactData() {
        if (!this.contactId) {
            console.warn('No contactId provided to loadContactData');
            return;
        }

        try {
            console.log('Fetching contact details for contactId:', this.contactId);
            const contact = await getContactDetails({ contactId: this.contactId });

            console.log('Contact data received:', JSON.stringify(contact));

            this.firstName = contact.FirstName || '';
            this.lastName = contact.LastName || '';
            this.email = contact.Email || '';
            this.username = contact.Email || '';
            this.alias = (contact.FirstName?.substring(0, 1) || 'u') + (contact.LastName?.substring(0, 4) || 'ser');
            console.log('Assigned email:', this.email);
            console.log('Assigned username:', this.username);

        } catch (error) {
            console.error('Error loading contact data:', error);
            this.showToast('Error loading contact', error.body?.message || 'Unknown error', 'error');
        }
    }

    async loadPicklists() {
        try {
            console.log('Fetching license and profile options...');
            const result = await getLicenseAndProfileOptions();
            this.licenseOptions = result.licenses;
            this.profileOptions = result.profiles;

            console.log('License Options:', JSON.stringify(this.licenseOptions));
            console.log('Profile Options:', JSON.stringify(this.profileOptions));

            // Auto-select "Customer Community" license
            const defaultLicense = this.licenseOptions.find(
                (option) => option.label === 'Customer Community Plus'
            );
            if (defaultLicense) {
                this.selectedLicense = defaultLicense.value;
                console.log('Auto-selected License:', this.selectedLicense);
            }

            // Auto-select "Customer Community User" profile
            const defaultProfile = this.profileOptions.find(
                (option) => option.label === 'RS Customer Community Plus User'
            );
            if (defaultProfile) {
                this.selectedProfile = defaultProfile.value;
                console.log('Auto-selected Profile:', this.selectedProfile);
            }

        } catch (error) {
            console.error('Error loading picklist options:', error);
            this.showToast('Error loading options', error.body?.message || 'Unknown error', 'error');
        }
    }


    handleChange(event) {
        const field = event.target.dataset.field;
        console.log(`Field changed: ${field} -> ${event.detail.value}`);
        this[field] = event.detail.value;
    }

    handleLicenseChange(event) {
        this.selectedLicense = event.detail.value;
        console.log('Selected License:', this.selectedLicense);
    }

    handleProfileChange(event) {
        this.selectedProfile = event.detail.value;
        console.log('Selected Profile:', this.selectedProfile);
    }

    async handleSubmit() {
        if (!this.contactId) {
            console.warn('No contactId during submit.');
            this.showToast('Missing Contact', 'Contact ID is required', 'error');
            return;
        }

        try {
            console.log('Creating portal user with:');
            console.log('ContactId:', this.contactId);
            console.log('Email:', this.email);
            console.log('Username:', this.username);
            console.log('Profile:', this.selectedProfile);
            console.log('Alias:', this.alias);
            console.log('FirstName:', this.firstName);
            console.log('LastName:', this.lastName);
            console.log('License:', this.selectedLicense);

            await createPortalUser({
                contactId: this.contactId,
                email: this.email,
                username: this.username,
                profileId: this.selectedProfile,
                alias: this.alias,
                firstName: this.firstName,
                lastName: this.lastName,
                license: this.selectedLicense
            });

            this.showToast('Success', 'User for Shobha Portal created successfully. Login details sent to email.', 'success');

            this.resetForm();
      this.dispatchEvent(new CloseActionScreenEvent());

// Optionally refresh view
setTimeout(() => {
    try {
        eval("$A.get('e.force:refreshView').fire();");
    } catch (e) {
        window.location.reload();
    }
}, 2000);

        } catch (error) {
            console.error('Error creating user:', error);
            this.showToast('Error creating user', error.body?.message || 'Unknown error', 'error');
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    resetForm() {
        console.log('Resetting form');
        this.firstName = '';
        this.lastName = '';
        this.email = '';
        this.username = '';
        this.alias = '';
        this.selectedLicense = '';
        this.selectedProfile = '';
    }
}