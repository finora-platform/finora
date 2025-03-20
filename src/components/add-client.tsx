
/**
 * Replace this with dynamic form thats complletely template driven
 */
import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ClientForm = ({ 
  onSubmit,
  initialData = {},
  isLoading = false,
  onCancel,
  mode = 'create'
}) => {
  const [formData, setFormData] = useState({
    clientName: '',
    kycStatus: 'pending',
    assignedRM: '',
    riskProfile: '',
    email: '',
    number: '',
    plan: 'standard',
    createdDate: new Date().toISOString().split('T')[0],
    ...initialData
  });

  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.clientName.trim()) 
      newErrors.clientName = 'Client name is required';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      newErrors.email = 'Valid email is required';
    if (!formData.number.match(/^\+?[\d\s-]{10,}$/))
      newErrors.number = 'Valid phone number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'New Client' : 'Edit Client'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Client Name"
                value={formData.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                className={errors.clientName ? 'border-red-500' : ''}
              />
              {errors.clientName && (
                <span className="text-sm text-red-500">{errors.clientName}</span>
              )}
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <Select
                  value={formData.kycStatus}
                  onValueChange={(value) => handleChange('kycStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="KYC Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        Verified
                      </div>
                    </SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        Pending
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Input
                  placeholder="Assigned RM"
                  value={formData.assignedRM}
                  onChange={(e) => handleChange('assignedRM', e.target.value)}
                />
              </div>
            </div>

            <Input
              placeholder="Risk Profile"
              value={formData.riskProfile}
              onChange={(e) => handleChange('riskProfile', e.target.value)}
            />

            <div>
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <span className="text-sm text-red-500">{errors.email}</span>
              )}
            </div>

            <div>
              <Input
                placeholder="Phone Number"
                value={formData.number}
                onChange={(e) => handleChange('number', e.target.value)}
                className={errors.number ? 'border-red-500' : ''}
              />
              {errors.number && (
                <span className="text-sm text-red-500">{errors.number}</span>
              )}
            </div>

            <Select
              value={formData.plan}
              onValueChange={(value) => handleChange('plan', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elite">Elite</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="lite">Lite</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={formData.createdDate}
              onChange={(e) => handleChange('createdDate', e.target.value)}
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-4">
        {isDirty && (
          <Alert className="absolute bottom-20 left-4">
            <AlertDescription>
              You have unsaved changes
            </AlertDescription>
          </Alert>
        )}
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || Object.keys(errors).length > 0}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          {mode === 'create' ? 'Create Client' : 'Update Client'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ClientForm;