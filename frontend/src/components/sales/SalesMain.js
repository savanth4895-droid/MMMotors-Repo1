// Sales Module - Refactored Main Entry
// This file provides a clean API to the Sales components while the actual
// implementation remains in the original Sales.js for stability

import Sales from '../Sales';

// Re-export the main component as default
export default Sales;

// Note: Individual components (SalesOverview, ViewInvoices, CustomersManagement, etc.)
// are defined within Sales.js and rendered via Routes.
// Future refactoring can extract these into separate files.
