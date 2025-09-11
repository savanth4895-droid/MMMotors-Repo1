import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Bike, User, Lock, Mail, UserCheck } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = () => {
  const { login } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'staff',
    full_name: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('Login attempt started with:', loginData);

    try {
      console.log('Making API call to:', `${API}/auth/login`);
      console.log('API constant value:', API);
      
      const response = await axios.post(`${API}/auth/login`, loginData, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Login API response received:', response.status);
      console.log('Response data:', response.data);
      
      const { access_token, user } = response.data;
      console.log('Extracted token and user:', { token: access_token ? 'present' : 'missing', user });
      
      login(user, access_token);
      console.log('Called login function, should redirect now');
      
      toast.success('Login successful!');
    } catch (error) {
      console.error('Login error occurred:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Network error:', error.code);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed';
      toast.error(errorMessage);
    } finally {
      console.log('Login process completed, setting loading to false');
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axios.post(`${API}/auth/register`, registerData);
      toast.success('Registration successful! You can now log in.');
      
      // Clear form
      setRegisterData({
        username: '',
        email: '',
        password: '',
        role: 'staff',
        full_name: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="absolute inset-0 bg-black/20"></div>
      
      <Card className="w-full max-w-md glass border-white/20 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">Moto Management</CardTitle>
            <CardDescription className="text-blue-100">
              Two Wheeler Business System
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={loginData.username}
                      onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 btn-hover"
                  disabled={isLoading}
                >
                  {isLoading ? <div className="spinner"></div> : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-white">Full Name</Label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="full_name"
                      type="text"
                      placeholder="Enter your full name"
                      value={registerData.full_name}
                      onChange={(e) => setRegisterData({...registerData, full_name: e.target.value})}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg_username" className="text-white">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="reg_username"
                      type="text"
                      placeholder="Choose a username"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg_password" className="text-white">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="reg_password"
                      type="password"
                      placeholder="Choose a password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-white">Role</Label>
                  <Select 
                    value={registerData.role} 
                    onValueChange={(value) => setRegisterData({...registerData, role: value})}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-2 btn-hover"
                  disabled={isLoading}
                >
                  {isLoading ? <div className="spinner"></div> : 'Register'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;