import { LightningElement, wire, track } from 'lwc';
import getBookedProperties from '@salesforce/apex/ShobhaProjectController.getBookedProperties';
import getProjectById from '@salesforce/apex/ShobhaProjectController.getProjectById';

export default class RSBookedProperties extends LightningElement {
  @track properties = [];

  @wire(getBookedProperties)
  async wiredProperties({ error, data }) {
    if (data) {
      console.log('Booked properties raw:', JSON.stringify(data));

      const updatedProperties = await Promise.all(
        data.map(async (prop) => {
          let projectDetails = null;

          if (prop.Project__c) {
            try {
              projectDetails = await getProjectById({ recordId: prop.Project__c });
              console.log(`Project details for ${prop.Project__c}:`, projectDetails);
            } catch (projErr) {
              console.error(`Error fetching project for property ${prop.Id}`, projErr);
            }
          }

          return {
            ...prop,
           PropertyImages: prop.PropertyImages__r?.records || [],
            ProjectDetails: projectDetails
          };
        })
      );

      console.log('Final mapped properties:', JSON.stringify(updatedProperties));
      this.properties = updatedProperties;
    } else if (error) {
      console.error('Error loading booked properties:', error);
    }
  }
}