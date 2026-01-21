// Services Module - Refactored Main Entry
// This file provides a clean API to the Services components while the actual
// implementation remains in the original Services.js for stability

import Services from '../Services';

// Re-export the main component as default
export default Services;

// Note: Individual components (ServicesOverview, JobCards, ServiceDue, etc.)
// are defined within Services.js and rendered via Routes.
// Future refactoring can extract these into separate files.
