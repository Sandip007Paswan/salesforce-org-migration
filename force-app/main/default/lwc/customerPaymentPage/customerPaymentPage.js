import { LightningElement, wire, track, api } from 'lwc';
import getCustomerPayment from '@salesforce/apex/ShobhaProjectController.getCustomerPaymentsByProperty';
import updatePaymentStatusToUnderReview from '@salesforce/apex/ShobhaProjectController.updatePaymentStatusToUnderReview';
import uploadFilesToPayment from '@salesforce/apex/ShobhaProjectController.uploadFilesToPayment';
import getUploadedFilesForPayments from '@salesforce/apex/ShobhaProjectController.getUploadedFilesForPayments';
import { CurrentPageReference } from 'lightning/navigation';
import { getStateParameters } from 'c/utils';
export default class CustomerPaymentPage extends LightningElement {
    @track payments = [];
    @track uploadMessage = '';
    @track activeUploadPaymentId = null;
    fileMap = new Map();
    @api selectedPropertyId;

    @wire(CurrentPageReference)
    setCurrentPageReference(currentPageReference) {
        console.log('🌐 Current Page Reference:', JSON.stringify(currentPageReference));
        if (currentPageReference?.state?.c__propertyId || currentPageReference?.state?.propertyId) {
            this.selectedPropertyId = currentPageReference.state.c__propertyId || currentPageReference.state.propertyId;
          const state = currentPageReference?.state || {};
this.selectedPropertyId = state.c__propertyId || state.propertyId;
this.propertyName = decodeURIComponent(state.propertyName || '');

            console.log('🏡 selectedPropertyId:', this.selectedPropertyId);
        }
    }



    @wire(getCustomerPayment, { propertyId: '$selectedPropertyId' })
    wiredPayments({ error, data }) {
        if (data) {
            console.log('✅ Payments retrieved:', JSON.stringify(data));

            // Find the highest EMI number to calculate total EMIs
            const totalEmis = Math.max(...data.map(p => p.EMI_Number__c || 0));

            this.payments = data.map(p => {
                const dueDate = new Date(p.Payment_Due_Date__c);
                const emiMonth = dueDate.toLocaleString('default', { month: 'long', year: 'numeric' });
                const emiNumber = p.EMI_Number__c;

                const emiLabel = emiNumber
                    ? `💳 EMI ${emiNumber} of ${totalEmis} – Due ${emiMonth}`
                    : `💳 Installment – Due ${emiMonth}`;

                return {
                    ...p,
                    showUpload: p.Status__c === 'Pending',
                    isUnderReview: p.Status__c === 'Under Review',
                    isPaidOrUnderReview: p.Status__c === 'Paid' || p.Status__c === 'Under Review',
                    uploadedFiles: [],
                    showSubmit: false,
                    emiLabel,
                    badgeClass: this.getStatusBadgeClass(p),
                    isPaid: p.Status__c === 'Paid' 
                };
            });
            const paymentIds = data.map(p => p.Id);
            getUploadedFilesForPayments({ paymentIds })
                .then(fileMap => {
                    this.payments = this.payments.map(p => {
                        return {
                            ...p,
                            uploadedFiles: fileMap[p.Id] || [],
                            showUpload: p.Status__c === 'Pending',
                            isUnderReview: p.Status__c === 'Under Review',

                            showSubmit: false,
                            badgeClass: this.getStatusBadgeClass(p),
                            isPaid: p.Status__c === 'Paid'
                        };
                    });
                });


            console.log('📦 Payments with EMI labels:', this.payments);
        } else if (error) {
            console.error('❌ Error fetching payments:', error);
            this.payments = [];
        }
    }


    getStatusBadgeClass(payment) {
        switch (payment.Status__c) {
            case 'Paid':
                return 'slds-badge slds-theme_success';
            case 'Overdue':
                return 'slds-badge slds-theme_error';
            case 'Pending':
                return 'slds-badge slds-theme_warning';
            case 'Under Review':
                return 'slds-badge slds-theme_info';
            default:
                return 'slds-badge';
        }
    }



    isPaid(payment) {
        return payment.Status__c === 'Paid';
    }

    handleFileSelect(event) {
        const files = event.target.files;
        const paymentId = event.target.dataset.paymentId;

        if (files && paymentId) {
            const selected = Array.from(files);
            this.payments = this.payments.map(p => {
                if (p.Id === paymentId) {
                    return {
                        ...p,
                        selectedFiles: selected, // store selected before upload
                        uploadedFiles: p.uploadedFiles || []
                    };
                }
                return p;
            });
        }
    }

    handleRemoveFile(event) {
        const paymentId = event.target.dataset.paymentId;
        const index = parseInt(event.target.dataset.index, 10);

        this.payments = this.payments.map(p => {
            if (p.Id === paymentId && Array.isArray(p.selectedFiles)) {
                const updatedFiles = [...p.selectedFiles];
                updatedFiles.splice(index, 1);
                return {
                    ...p,
                    selectedFiles: updatedFiles
                };
            }
            return p;
        });
    }



    handleFileUpload(event) {
        const paymentId = event.target.dataset.paymentId;
        const payment = this.payments.find(p => p.Id === paymentId);
        const files = payment?.selectedFiles || [];

        if (!files.length) {
            this.showToast('Error', 'Please select file(s) before uploading.', 'error');
            return;
        }

        let uploadPromises = [];

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];

                uploadPromises.push(
                    uploadFilesToPayment({
                        paymentId,
                        fileName: file.name,
                        base64Data: base64
                    })
                );

                // Only once all files are read and upload promises are gathered
                if (uploadPromises.length === files.length) {
                    Promise.all(uploadPromises)
                        .then(() => {
                            // 👇 After upload, update status to Under Review
                            return updatePaymentStatusToUnderReview({ paymentId });
                        })
                        .then(() => {
                            // 👇 After status update, refresh files and UI
                            this.refreshUploadedFilesAndStatus(paymentId);
                            this.showToast('Success', 'Receipt uploaded and status set to Under Review.', 'success');
                        })
                        .catch(error => {
                            console.error('❌ Upload or status update failed:', error);
                            this.showToast('Error', 'Upload failed or status update failed.', 'error');
                        });
                }
            };
            reader.readAsDataURL(file);
        });
    }



    refreshUploadedFiles(paymentIds) {
        getUploadedFilesForPayments({ paymentIds })
            .then(resultMap => {
                this.payments = this.payments.map(p => {
                    if (paymentIds.includes(p.Id)) {
                        return {
                            ...p,
                            uploadedFiles: resultMap[p.Id] || [],
                            selectedFiles: [],
                            showSubmit: true
                        };
                    }
                    return p;
                });
            })
            .catch(error => {
                console.error('❌ Error fetching uploaded files:', error);
            });
    }




    get noPayments() {
        const result = Array.isArray(this.payments) && this.payments.length === 0;
        console.log('📭 noPayments:', result, '| payments:', this.payments);
        return result;
    }

    handleSubmit(event) {
        const paymentId = event.target.dataset.paymentId;

        updatePaymentStatusToUnderReview({ paymentId })
            .then(() => {
                this.refreshUploadedFilesAndStatus(paymentId);
                this.showToast('Success', 'Payment submitted. Status set to Under Review.', 'success');
            })
            .catch(error => {
                console.error('❌ Error updating payment status to Under Review:', error);
                this.showToast('Error', 'Failed to submit payment.', 'error');
            });
    }
    refreshUploadedFilesAndStatus(paymentId) {
        getUploadedFilesForPayments({ paymentIds: [paymentId] })
            .then(resultMap => {
                this.payments = this.payments.map(p => {
                    if (p.Id === paymentId) {
                        return {
                            ...p,
                            uploadedFiles: resultMap[p.Id] || [], // ✅ Set uploadedFiles here
                            selectedFiles: [],
                            showUpload: false,
                            showSubmit: false,
                            Status__c: 'Under Review',
                            badgeClass: this.getStatusBadgeClass({ Status__c: 'Under Review' }),
                            isUnderReview: true
                        };
                    }
                    return p;
                });
            })
            .catch(error => {
                console.error('❌ Error refreshing uploaded files or status:', error);
            });
    }
get propertyHeader() {
    if (this.propertyName && this.payments?.length) {
        const mode = this.payments[0].Mode_of_Payment__c;
        const label = mode === 'One-Time' ? 'Payment Details' : 'EMI Details';
        return `💳 ${label} for Property: ${this.propertyName}`;
    }
    return '💳 Payment Details';
}






    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}