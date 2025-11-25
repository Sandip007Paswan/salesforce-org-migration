// import { LightningElement, track } from 'lwc';
// import { NavigationMixin } from 'lightning/navigation';

// const MAX_FAVORITES = 8;

// const ALL_ACTIONS = [
//     { label: 'Lead', value: 'Lead', icon: '👤' },
//     { label: 'Contact', value: 'Contact', icon: '📇' },
//     { label: 'Opportunity', value: 'Opportunity', icon: '💼' },
//     { label: 'Account', value: 'Account', icon: '🏢' },
//     { label: 'Task', value: 'Task', icon: '✅' },
//     { label: 'Flow', value: 'Flow', icon: '🔄' },
//     { label: 'Case', value: 'Case', icon: '📂' },
//     { label: 'Campaign', value: 'Campaign', icon: '📢' },
//     { label: 'Event', value: 'Event', icon: '📅' },
//     { label: 'Note', value: 'Note', icon: '📝' },
//     { label: 'Report', value: 'Report', icon: '📊' },
//     { label: 'Dashboard', value: 'Dashboard', icon: '📈' }
// ];

// export default class GlobalQuickLauncher extends NavigationMixin(LightningElement) {
//     @track showModal = false;
//     @track showList = false;
//     @track favoriteActions = [];

//     connectedCallback() {
//         const saved = localStorage.getItem('favoriteQuickActions');
//         if (saved) {
//             try {
//                 const parsed = JSON.parse(saved);
//                 // Only keep valid actions from ALL_ACTIONS
//                 this.favoriteActions = parsed.filter(savedAction =>
//                     ALL_ACTIONS.some(a => a.value === savedAction.value)
//                 );
//             } catch (e) {
//                 console.warn('Failed to parse saved favorites:', e);
//             }
//         } else {
//             // Default values
//             this.favoriteActions = [
//                 { label: 'Lead', value: 'Lead', icon: '👤' },
//                 { label: 'Contact', value: 'Contact', icon: '📇' },
//                 { label: 'Task', value: 'Task', icon: '✅' }
//             ];
//         }
//     }

//     toggleModal() {
//         this.showModal = !this.showModal;
//     }

//     toggleListVisibility() {
//         this.showList = !this.showList;
//     }

//     get toggleButtonLabel() {
//         return this.showList ? 'Hide All Actions' : 'Show All Actions';
//     }

//     get computedListClass() {
//         return this.showList ? 'action-list visible' : 'action-list';
//     }

//     get favoriteActionsWithStyle() {
//         const count = this.favoriteActions.length;
//         const angle = 360 / count;
//         return this.favoriteActions.map((action, index) => {
//             const style = `transform: translate(-50%, -50%) rotate(${angle * index}deg) translate(0, -140px) rotate(-${angle * index}deg);`;
//             return { ...action, style };
//         });
//     }

//     get computedActions() {
//         const favoritesSet = new Set(this.favoriteActions.map(fav => fav.value));
//         const favorites = this.favoriteActions.map(action => ({ ...action, isFavorite: true }));
//         const nonFavorites = ALL_ACTIONS
//             .filter(action => !favoritesSet.has(action.value))
//             .map(action => ({ ...action, isFavorite: false }));

//         return [...favorites, ...nonFavorites];
//     }

//     toggleFavorite(event) {
//         const value = event.currentTarget.dataset.value;
//         const isFav = this.favoriteActions.some(fav => fav.value === value);

//         if (isFav) {
//             this.favoriteActions = this.favoriteActions.filter(fav => fav.value !== value);
//         } else {
//             if (this.favoriteActions.length >= MAX_FAVORITES) {
//                 alert('You can only pin up to 8 actions in the circle.');
//                 return;
//             }
//             const toAdd = ALL_ACTIONS.find(action => action.value === value);
//             if (toAdd) {
//                 this.favoriteActions = [...this.favoriteActions, toAdd];
//             }
//         }

//         // Save updated favorites to localStorage
//         localStorage.setItem('favoriteQuickActions', JSON.stringify(this.favoriteActions));
//     }

//     handleActionClick(event) {
//         const value = event.currentTarget.dataset.value;
//         if (value === 'Flow') {
//             this.launchFlow();
//         } else if (value === 'Dashboard') {
//             this[NavigationMixin.Navigate]({
//                 type: 'standard__navItemPage',
//                 attributes: { apiName: 'Dashboard' }
//             });
//         } else {
//             this.navigateToNewRecord(value);
//         }
//     }

//     launchFlow() {
//         this[NavigationMixin.Navigate]({
//             type: 'standard__flow',
//             attributes: { flowApiName: 'Quick_Create_Flow' }
//         });
//     }

//     navigateToNewRecord(objectApiName) {
//         this[NavigationMixin.Navigate]({
//             type: 'standard__objectPage',
//             attributes: { objectApiName, actionName: 'new' }
//         });
//     }
// }





// // LWC JS (updated version of your original component)
// import { LightningElement, track, wire } from 'lwc';
// import { NavigationMixin } from 'lightning/navigation';
// import getActions from '@salesforce/apex/QuickLauncherService.getActions';

// const MAX_FAVORITES = 8;

// export default class GlobalQuickLauncher extends NavigationMixin(LightningElement) {
//     @track showModal = false;
//     @track showList = false;
//     @track allActions = [];
//     @track favoriteActions = [];

//     @wire(getActions)
//     wiredActions({ data, error }) {
//         if (data) {
//             this.allActions = data.map(action => ({
//                 label: action.Label__c,
//                 value: action.ApiName__c,
//                 icon: action.Icon__c
//             }));

//             const saved = localStorage.getItem('favoriteQuickActions');
//             if (saved) {
//                 try {
//                     const parsed = JSON.parse(saved);
//                     this.favoriteActions = parsed.filter(sa =>
//                         this.allActions.some(a => a.value === sa.value)
//                     );
//                 } catch (e) {
//                     console.warn('Error parsing favorites', e);
//                 }
//             }
//         } else if (error) {
//             console.error('Error fetching actions', error);
//         }
//     }

//     toggleModal() {
//         this.showModal = !this.showModal;
//     }

//     toggleListVisibility() {
//         this.showList = !this.showList;
//     }

//     get toggleButtonLabel() {
//         return this.showList ? 'Hide All Actions' : 'Show All Actions';
//     }

//     get computedListClass() {
//         return this.showList ? 'action-list visible' : 'action-list';
//     }

//     get favoriteActionsWithStyle() {
//         const count = this.favoriteActions.length;
//         const angle = 360 / count;
//         return this.favoriteActions.map((action, index) => {
//             const style = `transform: translate(-50%, -50%) rotate(${angle * index}deg) translate(0, -140px) rotate(-${angle * index}deg);`;
//             return { ...action, style };
//         });
//     }

//     get computedActions() {
//         const favSet = new Set(this.favoriteActions.map(f => f.value));
//         const favs = this.favoriteActions.map(a => ({ ...a, isFavorite: true }));
//         const others = this.allActions
//             .filter(a => !favSet.has(a.value))
//             .map(a => ({ ...a, isFavorite: false }));
//         return [...favs, ...others];
//     }

//     toggleFavorite(event) {
//         const value = event.currentTarget.dataset.value;
//         const isFav = this.favoriteActions.some(f => f.value === value);

//         if (isFav) {
//             this.favoriteActions = this.favoriteActions.filter(f => f.value !== value);
//         } else {
//             if (this.favoriteActions.length >= MAX_FAVORITES) {
//                 alert('You can only pin up to 8 actions in the circle.');
//                 return;
//             }
//             const toAdd = this.allActions.find(a => a.value === value);
//             if (toAdd) {
//                 this.favoriteActions = [...this.favoriteActions, toAdd];
//             }
//         }

//         localStorage.setItem('favoriteQuickActions', JSON.stringify(this.favoriteActions));
//     }

//     handleActionClick(event) {
//         const value = event.currentTarget.dataset.value;
//         if (value === 'Flow') {
//             this.launchFlow();
//         } else if (value === 'Dashboard') {
//             this[NavigationMixin.Navigate]({
//                 type: 'standard__navItemPage',
//                 attributes: { apiName: 'Dashboard' }
//             });
//         } else {
//             this.navigateToNewRecord(value);
//         }
//     }

//     launchFlow() {
//         this[NavigationMixin.Navigate]({
//             type: 'standard__flow',
//             attributes: { flowApiName: 'Quick_Create_Flow' }
//         });
//     }

//     navigateToNewRecord(objectApiName) {
//         this[NavigationMixin.Navigate]({
//             type: 'standard__objectPage',
//             attributes: { objectApiName, actionName: 'new' }
//         });
//     }
// }

import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getActions from '@salesforce/apex/QuickLauncherService.getActions';

const MAX_FAVORITES = 8;

// These will always be included as fallback
const DEFAULT_FAVORITES = [
    { label: 'Lead', value: 'Lead', icon: 'standard:lead' },
    { label: 'Contact', value: 'Contact', icon: 'standard:contact' },
    { label: 'Task', value: 'Task', icon: 'standard:task' }
];


export default class GlobalQuickLauncher extends NavigationMixin(LightningElement) {
    @track showModal = false;
    @track showList = false;
    @track allActions = [];
    @track favoriteActions = [];

    @wire(getActions)
        wiredActions({ data, error }) {
        if (data) {
            console.log('Raw server data:', JSON.stringify(data));
           const serverActions = data.map(a => ({
                label: a.Label__c,
                value: a.Object_Api_Name__c, // fallback to empty string if somehow null
                icon: a.Icon__c
            }));
            console.log('Mapped actions:',JSON.stringify(serverActions));
            // Merge defaults if missing in server
            const defaultActionsNotInServer = DEFAULT_FAVORITES.filter(df =>
                !serverActions.some(sa => sa.value === df.value)
            );

            this.allActions = [...defaultActionsNotInServer, ...serverActions];

            const saved = localStorage.getItem('favoriteQuickActions');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const validSaved = parsed.filter(sa =>
                        this.allActions.some(a => a.value === sa.value)
                    );
                    if (validSaved.length > 0) {
                        this.favoriteActions = validSaved.map(fav => {
                            const match = this.allActions.find(a => a.value === fav.value);
                            return { ...fav, icon: match.icon || fav.icon || '📌' };
                        });
                        return;
                    }
                } catch (e) {
                    console.warn('Invalid localStorage format');
                }
            }

            // No saved favorites → use default ones
            this.favoriteActions = DEFAULT_FAVORITES;
        } else if (error) {
            console.error('Apex error:', error);
        }
    }

    toggleModal() {
        this.showModal = !this.showModal;
    }

    toggleListVisibility() {
        this.showList = !this.showList;
    }

    get toggleButtonLabel() {
        return this.showList ? 'Hide All Actions' : 'Show All Actions';
    }

    get computedListClass() {
        return this.showList ? 'action-list visible' : 'action-list';
    }

    get favoriteActionsWithStyle() {
        const count = this.favoriteActions.length;
        const angle = 360 / count;
        return this.favoriteActions.map((action, index) => {
            const style = `transform: translate(-50%, -50%) rotate(${angle * index}deg) translate(0, -140px) rotate(-${angle * index}deg);`;
            return { ...action, style };
        });
    }

    get computedActions() {
        const favSet = new Set(this.favoriteActions.map(f => f.value));
        const favs = this.favoriteActions.map(a => ({ ...a, isFavorite: true }));
        const others = this.allActions
            .filter(a => !favSet.has(a.value))
            .map(a => ({ ...a, isFavorite: false }));
        return [...favs, ...others];
    }

    toggleFavorite(event) {
        const value = event.currentTarget.dataset.value;
        const isFav = this.favoriteActions.some(f => f.value === value);

        if (isFav) {
            this.favoriteActions = this.favoriteActions.filter(f => f.value !== value);
        } else {
            if (this.favoriteActions.length >= MAX_FAVORITES) {
                alert('You can only pin up to 8 actions in the circle.');
                return;
            }
            const toAdd = this.allActions.find(a => a.value === value);
            if (toAdd) {
                this.favoriteActions = [...this.favoriteActions, toAdd];
            }
        }

        localStorage.setItem('favoriteQuickActions', JSON.stringify(this.favoriteActions));
    }

handleActionClick(event) {
    const clickedButton = event.target.closest('button');
    const value = clickedButton?.dataset?.value;

    console.log('Clicked dataset:', clickedButton?.dataset);
    console.log('Clicked action value:', value);

    if (!value) {
        console.warn('No value found for clicked action.');
        return;
    }

    if (value === 'Flow') {
        this.launchFlow();
    } else if (value === 'Dashboard') {
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: { apiName: 'Dashboard' }
        });
    } else {
        this.navigateToNewRecord(value);
    }
}







    launchFlow() {
        this[NavigationMixin.Navigate]({
            type: 'standard__flow',
            attributes: { flowApiName: 'Quick_Create_Flow' }
        });
    }

    navigateToNewRecord(objectApiName) {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName,
                actionName: 'new'
            }
        });
    }

}