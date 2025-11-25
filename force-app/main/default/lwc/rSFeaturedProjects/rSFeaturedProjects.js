import { LightningElement, track, wire } from 'lwc';
import getFeaturedProjects from '@salesforce/apex/ShobhaProjectController.getFeaturedProjects';
import { NavigationMixin } from 'lightning/navigation';

const VISIBLE_COUNT = 3;

export default class RSFeaturedProjects extends NavigationMixin(LightningElement) {
  @track projects = [];
  @track visibleProjects = [];
  error;

  currentIndex = 0;
  autoSlideInterval;

  @wire(getFeaturedProjects)
  wiredFeatured({ error, data }) {
    console.log('[FeaturedProjects] Apex wire fired');

    if (data) {
      console.log('[FeaturedProjects] Data received from Apex:', data);

      this.projects = data;
      this.error = undefined;
      this.currentIndex = 0;
      this.updateVisibleProjects();

      if (this.projects.length > VISIBLE_COUNT) {
        console.log('[FeaturedProjects] Starting auto-slide...');
        this.startAutoSlide();
      } else {
        console.log('[FeaturedProjects] Not enough projects to slide, stopping auto-slide.');
        this.stopAutoSlide();
      }

    } else if (error) {
      console.error('[FeaturedProjects] Error from Apex:', error);
      this.error = error.body?.message || error.statusText || 'Unknown error';
      this.projects = [];
      this.visibleProjects = [];
      this.stopAutoSlide();
    }
  }

  updateVisibleProjects() {
    if (!this.projects.length) {
      console.warn('[FeaturedProjects] No projects to display.');
      this.visibleProjects = [];
      return;
    }

    const visible = [];
    for (let i = 0; i < VISIBLE_COUNT; i++) {
      const idx = (this.currentIndex + i) % this.projects.length;
      visible.push(this.projects[idx]);
    }

    console.log('[FeaturedProjects] Visible projects updated:', visible);
    this.visibleProjects = visible;
  }

  startAutoSlide() {
    this.stopAutoSlide();
    this.autoSlideInterval = setInterval(() => {
      this.currentIndex = (this.currentIndex + VISIBLE_COUNT) % this.projects.length;
      this.updateVisibleProjects();
    }, 8000);
  }

  stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
      console.log('[FeaturedProjects] Auto-slide stopped.');
    }
  }

handleClick(event) {
  const projectId = event.currentTarget.dataset.id;
  console.log('🧭 Navigating to project detail for ID:', projectId);

  this[NavigationMixin.Navigate]({
    type: 'standard__webPage',
    attributes: {
      url: `/shobhadeveloper/s/project-detail?projectId=${projectId}`
    }
  });
}


  disconnectedCallback() {
    this.stopAutoSlide();
  }
}