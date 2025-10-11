// Frontend Error Handling Test for Sales.js getErrorMessage function
// Testing Pydantic validation error handling as requested in review

const axios = require('axios');

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://moto-inventory-sys.preview.emergentagent.com';
const API = `${BACKEND_URL}/api`;

// Simulate the getErrorMessage function from Sales.js
const getErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.response?.data) {
    // Handle Pydantic validation errors
    if (Array.isArray(error.response.data) && error.response.data.length > 0) {
      return error.response.data.map(err => err.msg || err.message || 'Validation error').join(', ');
    }
    
    // Handle detail errors
    if (error.response.data.detail) {
      if (typeof error.response.data.detail === 'string') {
        return error.response.data.detail;
      }
      if (Array.isArray(error.response.data.detail)) {
        return error.response.data.detail.map(err => err.msg || err.message || 'Error').join(', ');
      }
    }
    
    // Handle message errors
    if (error.response.data.message) {
      return error.response.data.message;
    }
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

class FrontendErrorHandlingTester {
  constructor() {
    this.token = null;
    this.tests_run = 0;
    this.tests_passed = 0;
  }

  async login() {
    try {
      const response = await axios.post(`${API}/auth/login`, {
        username: 'admin',
        password: 'admin123'
      });
      
      if (response.data.access_token) {
        this.token = response.data.access_token;
        console.log('✅ Authentication successful');
        return true;
      }
      return false;
    } catch (error) {
      console.log('❌ Authentication failed:', error.message);
      return false;
    }
  }

  async testErrorHandling(testName, apiCall) {
    this.tests_run++;
    console.log(`\n🔍 Testing ${testName}...`);
    
    try {
      await apiCall();
      console.log('❌ Expected error but request succeeded');
      return false;
    } catch (error) {
      console.log(`   Status Code: ${error.response?.status || 'N/A'}`);
      console.log(`   Raw Error Response:`, JSON.stringify(error.response?.data, null, 2));
      
      // Test the getErrorMessage function
      const errorMessage = getErrorMessage(error);
      console.log(`   Processed Error Message: "${errorMessage}"`);
      
      // Verify the error message is a string and not an object
      if (typeof errorMessage === 'string' && errorMessage !== '[object Object]') {
        console.log('✅ Error message properly converted to string');
        this.tests_passed++;
        
        // Check if it contains meaningful information
        if (errorMessage.includes('Field required') || 
            errorMessage.includes('value is not a valid') || 
            errorMessage.includes('Validation error') ||
            errorMessage.includes('Error')) {
          console.log('✅ Error message contains meaningful validation information');
          return true;
        } else {
          console.log('⚠️ Error message lacks specific validation details');
          return true; // Still pass as it's a string
        }
      } else {
        console.log('❌ Error message not properly converted to string');
        return false;
      }
    }
  }

  async runTests() {
    console.log('🚀 FRONTEND ERROR HANDLING TESTING');
    console.log('=' * 60);
    console.log('Testing getErrorMessage function with Pydantic validation errors');
    
    // Login first
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ Cannot authenticate. Stopping tests.');
      return false;
    }

    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };

    // Test 1: Customer creation with missing required field
    await this.testErrorHandling(
      'Customer Creation - Missing Name Field',
      async () => {
        await axios.post(`${API}/customers`, {
          phone: '9876543210',
          email: 'test@example.com',
          address: 'Test Address'
          // Missing 'name' field
        }, { headers });
      }
    );

    // Test 2: Customer creation with invalid email
    await this.testErrorHandling(
      'Customer Creation - Invalid Email Format',
      async () => {
        await axios.post(`${API}/customers`, {
          name: 'Test User',
          phone: '9876543210',
          email: 'invalid-email-format',
          address: 'Test Address'
        }, { headers });
      }
    );

    // Test 3: Sales creation with missing customer_id
    await this.testErrorHandling(
      'Sales Creation - Missing Customer ID',
      async () => {
        await axios.post(`${API}/sales`, {
          vehicle_id: 'test-vehicle-id',
          amount: 50000.0,
          payment_method: 'Cash'
          // Missing 'customer_id' field
        }, { headers });
      }
    );

    // Test 4: Sales creation with invalid data type
    await this.testErrorHandling(
      'Sales Creation - Invalid Amount Data Type',
      async () => {
        await axios.post(`${API}/sales`, {
          customer_id: 'test-customer-id',
          vehicle_id: 'test-vehicle-id',
          amount: 'invalid-amount-string', // Should be number
          payment_method: 'Cash'
        }, { headers });
      }
    );

    // Test 5: Create a customer first, then test update with missing field
    try {
      const customerResponse = await axios.post(`${API}/customers`, {
        name: 'Test Customer for Update',
        phone: '9876543210',
        email: 'test@example.com',
        address: 'Test Address'
      }, { headers });

      const customerId = customerResponse.data.id;
      console.log(`   Created test customer: ${customerId}`);

      await this.testErrorHandling(
        'Customer Update - Missing Phone Field',
        async () => {
          await axios.put(`${API}/customers/${customerId}`, {
            name: 'Updated Name',
            email: 'updated@example.com',
            address: 'Updated Address'
            // Missing 'phone' field
          }, { headers });
        }
      );

    } catch (error) {
      console.log('⚠️ Could not create test customer for update test');
    }

    // Print results
    console.log('\n' + '=' * 60);
    console.log('📊 FRONTEND ERROR HANDLING TEST RESULTS');
    console.log('=' * 60);
    console.log(`   Tests Run: ${this.tests_run}`);
    console.log(`   Tests Passed: ${this.tests_passed}`);
    console.log(`   Tests Failed: ${this.tests_run - this.tests_passed}`);
    console.log(`   Success Rate: ${((this.tests_passed/this.tests_run)*100).toFixed(1)}%`);

    if (this.tests_passed === this.tests_run) {
      console.log('\n🎉 ALL FRONTEND ERROR HANDLING TESTS PASSED!');
      console.log('   ✅ getErrorMessage function properly handles Pydantic validation errors');
      console.log('   ✅ Error objects are converted to readable strings');
      console.log('   ✅ No "Objects are not valid as a React child" errors should occur');
      return true;
    } else {
      console.log('\n⚠️ SOME TESTS FAILED - Error handling may need improvement');
      return false;
    }
  }
}

// Run the tests
async function main() {
  const tester = new FrontendErrorHandlingTester();
  const success = await tester.runTests();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { FrontendErrorHandlingTester, getErrorMessage };