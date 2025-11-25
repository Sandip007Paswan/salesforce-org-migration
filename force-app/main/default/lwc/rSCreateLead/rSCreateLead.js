import { LightningElement, track, api, wire } from 'lwc';
import createLead from '@salesforce/apex/LeadController.createLead';
import getCurrentUserContactInfo from '@salesforce/apex/LeadController.getCurrentUserContactInfo';
import LOGO from '@salesforce/resourceUrl/logo';
import saveLeadFile from '@salesforce/apex/LeadController.saveLeadFile';

export default class RSCreateLead extends LightningElement {
    @track firstName = '';
    @track lastName = '';
    @track email = '';
    @track mobile = '';
    @track preferredLocation = '';
    @track budget;
    @track propertyDescription = '';

    @track recordId = '';
    @track isLeadCreated = false;
    @track error;

    fileData;
    @track user = {};

    @api projectId;
    @api propertyId;

  connectedCallback() {
    console.log('📦 Received projectId (via @api):', this.projectId);
    console.log('🏘️ Received propertyId (via @api):', this.propertyId);
}

    get logoUrl() {
        return LOGO;
    }

    @wire(getCurrentUserContactInfo)
    wiredUser({ data, error }) {
        if (data) {
            this.user = data;
            this.firstName = data.FirstName || '';
            this.lastName = data.LastName || '';
            this.email = data.Email || '';
            this.mobile = data.MobilePhone || data.Phone || '';
        } else if (error) {
            console.error('Error fetching user info', error);
        }
    }



    get locationOptions() {
        return [
            { label: 'East Zone', value: 'East' },
            { label: 'West Zone', value: 'West' },
            { label: 'South Zone', value: 'South' },
            { label: 'North Zone', value: 'North' },
            { label: 'Center', value: 'Center' }
        ];
    }

    get formClass() {
        return this.isLeadCreated ? 'hidden' : '';
    }

    handleChange(event) {
        this[event.target.name] = event.target.value;
    }

    handleFileChange(event) {
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                this.fileData = {
                    filename: file.name,
                    base64: base64
                };
            };
            reader.readAsDataURL(file);
        }
    }


    handleSubmit(event) {
        event.preventDefault();
        this.error = undefined;
        this.isLeadCreated = false;

        // Logging for debugging
        console.log('📨 Submitting Lead:', {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            mobile: this.mobile,
            preferredLocation: this.preferredLocation,
            budget: this.budget,
            projectId: this.projectId,
            propertyId: this.propertyId,
            propertyDescription: this.propertyDescription
        });

        if (!this.projectId || !this.propertyId) {
            console.error('🚫 Missing required fields: Project ID or Property ID');
            return;
        }


        createLead({
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            mobile: this.mobile,
            preferredLocation: this.preferredLocation,
            budget: this.budget ? Number(this.budget) : null,
            projectId: this.projectId,
            propertyId: this.propertyId,
            propertyDescription: this.propertyDescription
        })
            .then(leadId => {
                this.recordId = leadId;
                this.isLeadCreated = true;

                if (this.fileData) {
                    return saveLeadFile({
                        base64Data: this.fileData.base64,
                        fileName: this.fileData.filename,
                        leadId: leadId
                    }).catch(err => {
            console.error('❌ Error uploading file:', err);
            // Don't block the lead success modal on file upload error
        });
                }
            })
            .then(() => {
                if (this.fileData) {
                    this.fileData = null;
                    this.template.querySelector('input[type="file"]').value = null;
                }
                this.template.querySelector('form').reset();
                setTimeout(() => {
                    this.dispatchEvent(new CustomEvent('closemodal'));
                }, 2000);
            })

            .catch(error => {
                console.error('🚫 Full error object:', error);

                // Try to get structured message
                if (error && error.body && typeof error.body.message === 'string') {
                    this.error = error.body.message;
                } else if (typeof error.message === 'string') {
                    this.error = error.message;
                } else {
                    this.error = 'Unknown error occurred while submitting the form.';
                }

                this.isLeadCreated = false;
                console.error('Error:', this.error);
            });

    }

    // closeModal() {
    //     this.isLeadCreated = false;
    //     this.recordId = '';
    // }
    closeModal() {
    this.isLeadCreated = false;
    this.recordId = '';
    this.dispatchEvent(new CustomEvent('closemodal'));
}


}