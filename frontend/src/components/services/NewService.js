import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LoadingSpinner } from '../ui/loading';
import { Search, FileSearch, Save } from 'lucide-react';
import { toast } from 'sonner';
import debounce from 'lodash/debounce';
import { API, getErrorMessage } from '../../utils/helpers';

const NewService = () => {
  const [registrationData, setRegistrationData] = useState({
    customer_name: '',
    phone_number: '',
    customer_address: '',
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_reg_no: '',
    chassis_number: '',
    engine_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [chassisOptions, setChassisOptions] = useState([]);

  // Close chassis options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('#chassis_number') && !event.target.closest('.chassis-dropdown')) {
        setChassisOptions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const brands = ['TVS', 'BAJAJ', 'HERO', 'HONDA', 'TRIUMPH', 'KTM', 'SUZUKI', 'APRILIA', 'YAMAHA', 'PIAGGIO', 'ROYAL ENFIELD'];

  const handleInputChange = (field, value) => {
    setRegistrationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChassisSelection = (selectedChassis) => {
    setRegistrationData(prev => ({
      ...prev,
      chassis_number: selectedChassis.chassis_number,
      vehicle_brand: selectedChassis.brand,
      vehicle_model: selectedChassis.model
    }));
    setChassisOptions([]);
    // Auto-fill other details based on selected chassis
    debouncedSearchByChassisNumber(selectedChassis.chassis_number);
  };

  // Search for customer data by phone number
  const searchByPhone = async (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length < 4) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const token = localStorage.getItem('token');
      
      // Search customers and sales data
      const [customersResponse, salesResponse] = await Promise.all([
        axios.get(`${API}/customers`, {
          params: {
            page: 1,
            limit: 10000,
            sort: 'created_at',
            order: 'desc'
          },
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/sales`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Find matching customer by mobile phone
      const customers = customersResponse.data.data || customersResponse.data;
      const matchingCustomer = customers.find(customer => 
        customer.mobile && customer.mobile.includes(phoneNumber)
      );

      if (matchingCustomer) {
        // Find associated sales record to get vehicle information
        const customerSales = salesResponse.data.filter(sale => 
          sale.customer_id === matchingCustomer.id
        );

        let vehicleInfo = null;
        if (customerSales.length > 0) {
          // Get vehicle details from the most recent sale
          const latestSale = customerSales.sort((a, b) => 
            new Date(b.sale_date) - new Date(a.sale_date)
          )[0];
          
          // Fetch vehicle details
          try {
            const vehicleResponse = await axios.get(`${API}/vehicles/${latestSale.vehicle_id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            vehicleInfo = vehicleResponse.data;
          } catch (error) {
          }
        }

        // Auto-populate form with found data
        setRegistrationData(prev => ({
          ...prev,
          customer_name: matchingCustomer.name || '',
          phone_number: matchingCustomer.mobile || '',
          customer_address: matchingCustomer.address || '',
          vehicle_brand: vehicleInfo?.brand || matchingCustomer.vehicle_info?.brand || '',
          vehicle_model: vehicleInfo?.model || matchingCustomer.vehicle_info?.model || '',
          vehicle_year: new Date().getFullYear().toString(),
          vehicle_reg_no: vehicleInfo?.vehicle_number || matchingCustomer.vehicle_info?.vehicle_number || '',
          chassis_number: vehicleInfo?.chassis_number || matchingCustomer.vehicle_info?.chassis_number || '',
          engine_number: vehicleInfo?.engine_number || ''
        }));

        toast.success('Customer details found and populated!');
      }
    } catch (error) {
      console.error('Error searching by phone:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Search for chassis number suggestions
  const searchChassisNumbers = async (partialChassisNumber) => {
    if (!partialChassisNumber || partialChassisNumber.length < 3) {
      setChassisOptions([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const vehiclesResponse = await axios.get(`${API}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filter vehicles by partial chassis number match
      const matchingVehicles = vehiclesResponse.data.filter(vehicle => 
        vehicle.chassis_number && 
        vehicle.chassis_number.toLowerCase().includes(partialChassisNumber.toLowerCase())
      ).slice(0, 10); // Limit to 10 suggestions

      setChassisOptions(matchingVehicles.map(vehicle => ({
        chassis_number: vehicle.chassis_number,
        brand: vehicle.brand,
        model: vehicle.model,
        vehicle_id: vehicle.id
      })));
    } catch (error) {
      console.error('Error fetching chassis numbers:', error);
      setChassisOptions([]);
    }
  };

  // Search for vehicle data by chassis number
  const searchByChassisNumber = async (chassisNumber) => {
    if (!chassisNumber || chassisNumber.length < 4) {
      return;
    }

    try {
      setSearchLoading(true);
      const token = localStorage.getItem('token');
      
      // Search vehicles and sales data
      const [vehiclesResponse, salesResponse, customersResponse] = await Promise.all([
        axios.get(`${API}/vehicles`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/sales`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/customers`, {
          params: {
            page: 1,
            limit: 10000,
            sort: 'created_at',
            order: 'desc'
          },
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const customers = customersResponse.data.data || customersResponse.data;

      // Find matching vehicle by chassis number
      const matchingVehicle = vehiclesResponse.data.find(vehicle => 
        vehicle.chassis_number && vehicle.chassis_number.toLowerCase() === chassisNumber.toLowerCase()
      );

      if (matchingVehicle) {
        // Find associated sales record and customer
        const vehicleSale = salesResponse.data.find(sale => 
          sale.vehicle_id === matchingVehicle.id
        );

        let customerInfo = null;
        if (vehicleSale) {
          customerInfo = customers.find(customer => 
            customer.id === vehicleSale.customer_id
          );
        }

        // Auto-populate form with found data
        setRegistrationData(prev => ({
          ...prev,
          customer_name: customerInfo?.name || '',
          phone_number: customerInfo?.mobile || '',
          customer_address: customerInfo?.address || '',
          vehicle_brand: matchingVehicle.brand || '',
          vehicle_model: matchingVehicle.model || '',
          vehicle_year: new Date().getFullYear().toString(),
          chassis_number: matchingVehicle.chassis_number || '',
          engine_number: matchingVehicle.engine_number || '',
          vehicle_reg_no: matchingVehicle.vehicle_number || ''
        }));

        toast.success('Vehicle details found and populated!');
      }
    } catch (error) {
      console.error('Error searching by chassis:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search functions
  const debouncedSearchByPhone = useCallback(
    debounce((phoneNumber) => searchByPhone(phoneNumber), 500),
    []
  );

  const debouncedSearchByChassisNumber = useCallback(
    debounce((chassisNumber) => searchByChassisNumber(chassisNumber), 500),
    []
  );

  const debouncedSearchChassisNumbers = useCallback(
    debounce((partialChassisNumber) => searchChassisNumbers(partialChassisNumber), 300),
    []
  );

  const resetForm = () => {
    setRegistrationData({
      customer_name: '',
      phone_number: '',
      customer_address: '',
      vehicle_brand: '',
      vehicle_model: '',
      vehicle_year: '',
      vehicle_reg_no: '',
      chassis_number: '',
      engine_number: ''
    });
    setChassisOptions([]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!registrationData.customer_name) {
      toast.error('Please enter customer name');
      setLoading(false);
      return;
    }
    if (!registrationData.phone_number) {
      toast.error('Please enter phone number');
      setLoading(false);
      return;
    }
    if (!registrationData.vehicle_reg_no) {
      toast.error('Please enter vehicle registration number');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Create registration record
      await axios.post(`${API}/registrations`, {
        customer_name: registrationData.customer_name,
        customer_mobile: registrationData.phone_number,
        customer_address: registrationData.customer_address,
        vehicle_number: registrationData.vehicle_reg_no,
        vehicle_brand: registrationData.vehicle_brand,
        vehicle_model: registrationData.vehicle_model,
        vehicle_year: registrationData.vehicle_year,
        chassis_number: registrationData.chassis_number,
        engine_number: registrationData.engine_number
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Customer & Vehicle registration completed successfully!');
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Customer & Vehicle Registration</CardTitle>
        <CardDescription>Register a customer and their vehicle (one-time). You can then create job cards for this registration.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          {/* Auto-fill Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Auto-fill Feature</h4>
                <p className="text-xs text-blue-600">
                  Enter mobile number or chassis number to automatically fill customer and vehicle details from existing sales records.
                </p>
              </div>
            </div>
          </div>

          {/* Customer Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  placeholder="Enter customer name"
                  value={registrationData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone_number">
                  Mobile
                  {searchLoading && <span className="ml-2 text-blue-600 text-sm">Searching...</span>}
                </Label>
                <Input
                  id="phone_number"
                  placeholder="Enter mobile number to auto-fill details"
                  value={registrationData.phone_number}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('phone_number', value);
                    debouncedSearchByPhone(value);
                  }}
                  className={searchLoading ? "border-blue-300" : ""}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="customer_address">Address</Label>
                <Input
                  id="customer_address"
                  placeholder="Enter customer address"
                  value={registrationData.customer_address}
                  onChange={(e) => handleInputChange('customer_address', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Vehicle Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-600 border-b pb-2">Vehicle Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle_reg_no">Vehicle Registration No</Label>
                <Input
                  id="vehicle_reg_no"
                  placeholder="Enter vehicle registration number"
                  value={registrationData.vehicle_reg_no}
                  onChange={(e) => handleInputChange('vehicle_reg_no', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicle_brand">Vehicle Brand</Label>
                <Select value={registrationData.vehicle_brand} onValueChange={(value) => handleInputChange('vehicle_brand', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicle_model">Vehicle Model</Label>
                <Input
                  id="vehicle_model"
                  placeholder="Enter vehicle model"
                  value={registrationData.vehicle_model}
                  onChange={(e) => handleInputChange('vehicle_model', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="vehicle_year">Vehicle Year</Label>
                <Input
                  id="vehicle_year"
                  placeholder="Enter vehicle year (e.g., 2024)"
                  value={registrationData.vehicle_year}
                  onChange={(e) => handleInputChange('vehicle_year', e.target.value)}
                  type="number"
                  min="1990"
                  max="2030"
                />
              </div>
              <div className="relative">
                <Label htmlFor="chassis_number">
                  Chassis Number
                  {searchLoading && <span className="ml-2 text-blue-600 text-sm">Searching...</span>}
                </Label>
                <Input
                  id="chassis_number"
                  placeholder="Enter chassis number"
                  value={registrationData.chassis_number}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('chassis_number', value);
                    debouncedSearchChassisNumbers(value);
                    if (value.length >= 4) {
                      debouncedSearchByChassisNumber(value);
                    }
                  }}
                  className={searchLoading ? "border-blue-300" : ""}
                />
                
                {/* Chassis Number Dropdown Suggestions */}
                {chassisOptions.length > 0 && (
                  <div className="chassis-dropdown absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                    {chassisOptions.map((option, index) => (
                      <div
                        key={index}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleChassisSelection(option)}
                      >
                        <div className="font-medium text-sm">{option.chassis_number}</div>
                        <div className="text-xs text-gray-600">{option.brand} {option.model}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="engine_number">Engine Number</Label>
                <Input
                  id="engine_number"
                  placeholder="Enter engine number"
                  value={registrationData.engine_number}
                  onChange={(e) => handleInputChange('engine_number', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <Button 
              type="submit" 
              disabled={loading} 
              className="flex-1 sm:flex-none sm:px-8"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving Registration...
                </>
              ) : 'Save Registration'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={resetForm}
              className="flex-1 sm:flex-none sm:px-8"
            >
              Reset Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};



export default NewService;
