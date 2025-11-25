import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation'; 
import getPropertiesWithImages from '@salesforce/apex/ShobhaProjectController.getPropertiesWithImages';

export default class RSPropertyCarousel extends NavigationMixin(LightningElement) {
    @track properties = [];
    selectedStatus = '';
    selectedMarkerId = '';
    selectedPriceRange = '';
    cityFilter = '';
    countryFilter = '';
    sortDirection = 'asc';

    center = {
        location: {
            Latitude: 20.5937,
            Longitude: 78.9629
        }
    };

    statusOptions = [
        { label: 'All', value: '' },
        { label: 'Available', value: 'Available' },
        { label: 'Booked', value: 'Booked' },
        { label: 'Blocked', value: 'Blocked' },
        { label: 'Hold', value: 'Hold' },
        { label: 'Under Negotiation', value: 'Under Negotiation' }
    ];

    priceRangeOptions = [
        { label: 'All', value: '' },
        { label: 'Below ₹50,00,000', value: '0-5000000' },
        { label: '₹50,00,000 - ₹1,00,00,000', value: '5000000-10000000' },
        { label: 'Above ₹1,00,00,000', value: '10000000-999999999' }
    ];

    @wire(getPropertiesWithImages)
    wiredProperties({ error, data }) {
        if (data) {
            console.log('Fetched properties from Apex:', JSON.stringify(data, null, 2)); // 🔍 DEBUG LOG
            this.properties = data.map(prop => {
                const fullAddress = `${prop.Street__c || ''}, ${prop.City__c || ''}, ${prop.State__c || ''}, ${prop.Country__c || ''}`;
                const images = (prop.PropertyImages__r || []).map(img => img.Property_Image_URL__c);
                
                return {
                    id: prop.Id,
                    name: prop.Name,
                    unitNo: prop.Unit_No__c,
                    carpetArea: prop.Carpet_Area__c,
                    price: prop.Price__c,
                    status: prop.Status__c,
                    street: prop.Street__c,
                    city: prop.City__c,
                    state: prop.State__c,
                    country: prop.Country__c,
                    fullAddress,
                    images,
                    currentImageIndex: 0,
                    currentImage: images.length > 0 ? images[0] : null
                };
            });
            console.log('Mapped properties for carousel:', JSON.stringify(this.properties, null, 2)); // 🧭 DEBUG MAPPED OUTPUT
        } else if (error) {
            console.error('Error loading properties', error);
        }
    }

    get filteredProperties() {
        let [minPrice, maxPrice] = this.selectedPriceRange ? this.selectedPriceRange.split('-').map(Number) : [null, null];

        let filtered = this.properties.filter(p => {
            const statusMatch = !this.selectedStatus || p.status === this.selectedStatus;
            const priceMatch = (!minPrice || p.price >= minPrice) && (!maxPrice || p.price <= maxPrice);
            const cityMatch = !this.cityFilter || (p.city && p.city.toLowerCase().includes(this.cityFilter));
            const countryMatch = !this.countryFilter || (p.country && p.country.toLowerCase().includes(this.countryFilter));
            return statusMatch && priceMatch && cityMatch && countryMatch;
        });

        if (this.sortDirection === 'asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (this.sortDirection === 'desc') {
            filtered.sort((a, b) => b.price - a.price);
        }

        return filtered;
    }

    get filteredMapMarkers() {
        return this.filteredProperties.map(prop => ({
            location: {
                Street: prop.street,
                City: prop.city,
                State: prop.state,
                Country: prop.country
            },
            value: prop.id,
            title: prop.name,
            description: prop.status
        }));
    }

    handleStatusChange(event) {
        this.selectedStatus = event.detail.value;
        this.selectedMarkerId = '';
    }

    handleMarkerSelect(event) {
        this.selectedMarkerId = event.detail.selectedMarkerValue;
    }

    handlePrev(event) {
        const id = event.target.dataset.id;
        const prop = this.filteredProperties.find(p => p.id === id);
        if (prop && prop.images.length > 0) {
            prop.currentImageIndex = (prop.currentImageIndex - 1 + prop.images.length) % prop.images.length;
            prop.currentImage = prop.images[prop.currentImageIndex];
        }
    }

    handleNext(event) {
        const id = event.target.dataset.id;
        const prop = this.filteredProperties.find(p => p.id === id);
        if (prop && prop.images.length > 0) {
            prop.currentImageIndex = (prop.currentImageIndex + 1) % prop.images.length;
            prop.currentImage = prop.images[prop.currentImageIndex];
        }
    }

    handlePriceRangeChange(event) {
        this.selectedPriceRange = event.detail.value;
    }

    handleCityChange(event) {
        this.cityFilter = event.detail.value.toLowerCase();
    }

    handleCountryChange(event) {
        this.countryFilter = event.detail.value.toLowerCase();
    }

    handleSortChange(event) {
        this.sortDirection = event.detail.value;
    }

    get sortOptions() {
        return [
            { label: 'Price: Low to High', value: 'asc' },
            { label: 'Price: High to Low', value: 'desc' }
        ];
    }

        handleImageClick(event) {
        const recordId = event.target.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'Property__c', // API name of your custom object
                actionName: 'view'
            }
        });
    }

}