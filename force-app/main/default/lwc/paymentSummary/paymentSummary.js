import { LightningElement, track } from 'lwc';
import getSummaries from '@salesforce/apex/ShobhaProjectController.getPropertyPaymentSummaries';

export default class PaymentSummary extends LightningElement {
    @track summaries = [];
    @track loading = true;
    @track error;

    connectedCallback() {
        console.log('🔄 connectedCallback: Fetching summaries...');
        this.fetchSummaries();
    }

    // fetchSummaries() {
    //     getSummaries()
    //         .then(result => {
    //             console.log('✅ Result from Apex:', JSON.stringify(result));
    //             this.summaries = result.map(item => {
    //                 const pending = (item.totalPayable || 0) - (item.totalPaid || 0);
    //                 const next = item.payments?.find(p => p.status !== 'Paid');

    //                 return {
    //                     ...item,
    //                     pending,
    //                     nextEmi: next ? {
    //                         amount: next.amount,
    //                         dueDate: next.dueDate
    //                     } : null
    //                 };
    //             });
    //             this.loading = false;
    //         })
    //         .catch(err => {
    //             console.error('❌ Error loading summaries:', err);
    //             this.error = err;
    //             this.loading = false;
    //         });
    // }
    fetchSummaries() {
    console.log('🔄 Fetching property payment summaries...');
    getSummaries()
        .then(result => {
            console.log('✅ Raw result from Apex:', JSON.stringify(result));

            this.summaries = result.map(item => {
                const pending = (item.totalPayable || 0) - (item.totalPaid || 0);
                const next = item.payments?.find(p => p.status !== 'Paid');

                console.log(`📸 Image URL for property ${item.propertyName}: ${item.imageUrl}`);

                return {
                    ...item,
                    pending,
                    nextEmi: next ? {
                        amount: next.amount,
                        dueDate: next.dueDate
                    } : null
                };
            });

            this.loading = false;
        })
        .catch(err => {
            console.error('❌ Error loading summaries:', err);
            this.error = err;
            this.loading = false;
        });
}


   handleClick(event) {
    const propertyId = event.currentTarget.dataset.id;
    console.log('📍 handleClick called for propertyId:', propertyId);
      const summary = this.summaries.find(item => item.propertyId === propertyId);
    const propertyName = encodeURIComponent(summary?.propertyName || '');

    const url = `/shobhadeveloper/s/my-payments?propertyId=${propertyId}&propertyName=${propertyName}`;
    console.log('🌐 Redirecting to:', url);

    // Navigate using native JS (works reliably in Experience Cloud)
    window.location.href = url;
}

}