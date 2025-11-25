import { LightningElement, api, wire, track } from 'lwc';
import getProjectById from '@salesforce/apex/ShobhaProjectController.getProjectById';
import getPropertiesByProjectId from '@salesforce/apex/ShobhaProjectController.getPropertiesByProjectId';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CurrentPageReference } from 'lightning/navigation';
import { NavigationMixin } from 'lightning/navigation';
import { decodeDefaultFieldValue } from 'c/utils';

export default class PropertyDetails extends NavigationMixin(LightningElement) {
    @api recordId;
    project;
    properties = [];
    error;
    @track properties = [];

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            const id = currentPageReference.state?.projectId;
            if (id) {
                this.recordId = id;
                this.loadData();
            }
        }
    }

  async loadData() {
    try {
        const [projectResult, propertiesResult] = await Promise.all([
            getProjectById({ recordId: this.recordId }),
            getPropertiesByProjectId({ projectId: this.recordId })
        ]);

        // ✅ Assign projectResult to this.project
        this.project = projectResult;

        // ✅ Process properties and assign images
        this.properties = propertiesResult.map(prop => {
            const images = prop.PropertyImages__r?.map(img => img.Property_Image_URL__c) || [];
            return {
                ...prop,
                images,
                currentImageIndex: 0,
                currentImage: images.length > 0 ? images[0] : null
            };
        });

        console.log('✅ Project loaded:', this.project);
        console.log('✅ Properties loaded:', this.properties);

    } catch (err) {
        this.error = err;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error loading property details',
                message: err.body?.message || err.message,
                variant: 'error'
            })
        );
    }
}

    handlePrevImage(event) {
        const propId = event.target.dataset.id;
        const index = this.properties.findIndex(p => p.Id === propId);
        if (index !== -1) {
            const prop = this.properties[index];
            prop.currentImageIndex = (prop.currentImageIndex - 1 + prop.images.length) % prop.images.length;
            prop.currentImage = prop.images[prop.currentImageIndex];
            this.properties = [...this.properties]; // trigger reactivity
            console.log(`⬅️ Prev image for ${prop.Name}`, prop.currentImage);
        }
    }

    handleNextImage(event) {
        const propId = event.target.dataset.id;
        const index = this.properties.findIndex(p => p.Id === propId);
        if (index !== -1) {
            const prop = this.properties[index];
            prop.currentImageIndex = (prop.currentImageIndex + 1) % prop.images.length;
            prop.currentImage = prop.images[prop.currentImageIndex];
            this.properties = [...this.properties]; // trigger reactivity
            console.log(`➡️ Next image for ${prop.Name}`, prop.currentImage);
        }
    }


    getFirstImageUrl(prop) {
        if (
            prop?.PropertyImages__r &&
            Array.isArray(prop.PropertyImages__r) &&
            prop.PropertyImages__r.length > 0
        ) {
            return prop.PropertyImages__r[0].Property_Image_URL__c;
        }
        return ''; // Fallback URL or blank
    }

}