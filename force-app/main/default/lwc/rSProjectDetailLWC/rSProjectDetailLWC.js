import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation'; // ✅ Required
import getProjectById from '@salesforce/apex/ShobhaProjectController.getProjectById';
import getPropertiesByProjectId from '@salesforce/apex/ShobhaProjectController.getPropertiesByProjectId';

export default class RSProjectDetailLWC extends NavigationMixin(LightningElement) {
  @track project;
  @track error;
  @track properties = [];

  @track showModal = false;
  @track selectedProjectId;
  @track selectedPropertyId;

  connectedCallback() {
    const queryParams = new URLSearchParams(window.location.search);
    const projectId = queryParams.get('projectId');
    console.log('🔍 URL Param - projectId:', projectId);

    if (projectId) {
      this.loadProject(projectId);
    } else {
      this.error = 'No project ID provided in the URL.';
      console.warn('⚠️ No projectId in URL');
    }
  }

  async loadProject(id) {
    console.log('📦 Fetching project with ID:', id);
    try {
      const result = await getProjectById({ recordId: id });
      this.project = result;
      console.log('✅ Project loaded:', result);

      const props = await getPropertiesByProjectId({ projectId: id });
      this.properties = props.map(p => {
        const images = p.PropertyImages__r;
        const imageUrl = images && images.length > 0 ? images[0].Property_Image_URL__c : null;
        return { ...p, imageUrl };
      });
      console.log('🏘️ Properties with image URLs:', this.properties);


    } catch (error) {
      this.error = error.body?.message || error.message;
      this.project = undefined;
      this.properties = [];
      console.error('❌ Error loading project:', this.error);
    }
  }

  get completionETA() {
    return this.project?.Completion_ETA__c
      ? new Date(this.project.Completion_ETA__c).toLocaleDateString()
      : '';
  }

  get launchDateFormatted() {
    return this.project?.Launch_Date__c
      ? new Date(this.project.Launch_Date__c).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      : 'N/A';
  }

  handleEnquireClick(event) {
    const projectId = event.currentTarget.dataset.id;
    console.log('🧭 Navigating to Enquiry page for Project ID:', projectId);

    this[NavigationMixin.Navigate]({
      type: 'standard__webPage',
      attributes: {
        url: '/shobhadeveloper/s/enquiry?projectId=' + projectId
      }
    });
  }

  // handlePropertyEnquiry(event) {
  //   const projectId = event.currentTarget.dataset.projectId;
  //   const propertyId = event.currentTarget.dataset.propertyId;
  //   console.log('🧭 Enquiry for Project:', projectId, 'Property:', propertyId);

  //   this[NavigationMixin.Navigate]({
  //     type: 'standard__webPage',
  //     attributes: {
  //       url: `/shobhadeveloper/s/enquiry?projectId=${projectId}&propertyId=${propertyId}`
  //     }
  //   });
  // }
    handlePropertyEnquiry(event) {
    this.selectedProjectId = event.currentTarget.dataset.projectId;
    this.selectedPropertyId = event.currentTarget.dataset.propertyId;
    this.showModal = true;
  }
    closeModal() {
    this.showModal = false;
    this.selectedProjectId = null;
    this.selectedPropertyId = null;
  }


}