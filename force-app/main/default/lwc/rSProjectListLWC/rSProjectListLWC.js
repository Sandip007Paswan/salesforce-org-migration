import { LightningElement, api, wire, track } from 'lwc';
import getProjects from '@salesforce/apex/ShobhaProjectController.getProjects';
import { NavigationMixin } from 'lightning/navigation';

export default class RSProjectListLWC extends NavigationMixin(LightningElement) {
  @api status ;
  @track projects = [];
  error;

@wire(getProjects, { status: '$status' })
wiredProjects({ data, error }) {
  console.log('📥 Called getProjects with status:', this.status);

  if (data) {
    console.log('✅ Projects returned:', data);
    this.projects = data;
    this.error = undefined;
  } else if (error) {
    console.error('❌ Error fetching projects:', error);
    this.error = error.body?.message || 'Unknown error';
    this.projects = [];
  }
}
 handleClick(event) {
  const projectId = event.currentTarget.dataset.id;
  console.log('Navigating to project detail for ID:', projectId);

  this[NavigationMixin.Navigate]({
    type: 'standard__webPage',
    attributes: {
      url: `/shobhadeveloper/s/project-detail?projectId=${projectId}`
    }
  });
}



  // handleClick(event) {
  // //   const projectId = event.currentTarget.dataset.id;
  // // this[NavigationMixin.Navigate]({
  // //           type: 'standard__webPage',
  // //           attributes: {
  // //               url: `/project/${projectId}`
  // //           }
  // //       });

  
  // }
}