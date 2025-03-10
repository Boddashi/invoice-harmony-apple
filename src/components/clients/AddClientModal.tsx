
import React, { useState } from 'react';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (client: any) => void;
}

const AddClientModal = ({ isOpen, onClose, onAddClient }: AddClientModalProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  const [formData, setFormData] = useState({
    type: 'business',
    name: '',
    company: '',
    email: '',
    phone: '',
    street: '',
    number: '',
    bus: '',
    postcode: '',
    city: '',
    country: 'Belgium',
    vatNumber: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({ ...prev, type }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.name || !formData.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Name and email are required fields."
      });
      return;
    }

    // Create a new client with default values for invoices and totalSpent
    const newClient = {
      ...formData,
      id: crypto.randomUUID(),
      invoices: 0,
      totalSpent: '$0'
    };

    onAddClient(newClient);
    
    // Reset form and close modal
    setFormData({
      type: 'business',
      name: '',
      company: '',
      email: '',
      phone: '',
      street: '',
      number: '',
      bus: '',
      postcode: '',
      city: '',
      country: 'Belgium',
      vatNumber: ''
    });
    setCurrentStep(1);
    
    toast({
      title: "Success",
      description: "Client added successfully.",
    });
    
    onClose();
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name !== '' && formData.email !== '';
      case 2:
        return true; // Address is optional
      case 3:
        return true; // VAT and additional info is optional
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border/40 rounded-xl shadow-apple-lg dark:shadow-neon-md w-full max-w-md animate-in fade-in slide-in-from-bottom-10 my-8">
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <h2 className="text-lg font-semibold">Add New Client</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors rounded-full p-1"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Progress indicator */}
        <div className="px-4 pt-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm font-medium">
              {currentStep === 1 ? 'Basic Info' : currentStep === 2 ? 'Address' : 'Additional Info'}
            </span>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Type:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      className="w-4 h-4 accent-primary" 
                      checked={formData.type === 'business'}
                      onChange={() => handleTypeChange('business')} 
                    />
                    <span>Business</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      className="w-4 h-4 accent-primary" 
                      checked={formData.type === 'individual'}
                      onChange={() => handleTypeChange('individual')} 
                    />
                    <span>Individual</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field w-full" 
                  placeholder="Client name" 
                  required 
                />
              </div>
              
              {formData.type === 'business' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Company</label>
                  <input 
                    type="text" 
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="input-field w-full" 
                    placeholder="Company name" 
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field w-full" 
                  placeholder="client@example.com" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field w-full" 
                  placeholder="+32 123 456 789" 
                />
              </div>
            </div>
          )}
          
          {/* Step 2: Address */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Street</label>
                <input 
                  type="text" 
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  className="input-field w-full" 
                  placeholder="Street name" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Number</label>
                  <input 
                    type="text" 
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    className="input-field w-full" 
                    placeholder="123" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Bus</label>
                  <input 
                    type="text" 
                    name="bus"
                    value={formData.bus}
                    onChange={handleChange}
                    className="input-field w-full" 
                    placeholder="A" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Postcode</label>
                  <input 
                    type="text" 
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleChange}
                    className="input-field w-full" 
                    placeholder="1000" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">City</label>
                  <input 
                    type="text" 
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input-field w-full" 
                    placeholder="Brussels" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Country</label>
                <select 
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="input-field w-full"
                >
                  <option value="Belgium">Belgium</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="Luxembourg">Luxembourg</option>
                  <option value="France">France</option>
                  <option value="Germany">Germany</option>
                  <option value="United Kingdom">United Kingdom</option>
                </select>
              </div>
            </div>
          )}
          
          {/* Step 3: Additional Info */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              {formData.type === 'business' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">VAT Number</label>
                  <input 
                    type="text" 
                    name="vatNumber"
                    value={formData.vatNumber}
                    onChange={handleChange}
                    className="input-field w-full" 
                    placeholder="BE0123456789" 
                  />
                </div>
              )}
              
              {/* Summary of information */}
              <div className="mt-4 pt-4 border-t border-border/40">
                <h3 className="text-sm font-medium mb-2">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium capitalize">{formData.type}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  {formData.company && (
                    <div className="grid grid-cols-2">
                      <span className="text-muted-foreground">Company:</span>
                      <span className="font-medium">{formData.company}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                  {formData.phone && (
                    <div className="grid grid-cols-2">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{formData.phone}</span>
                    </div>
                  )}
                  {formData.street && (
                    <div className="grid grid-cols-2">
                      <span className="text-muted-foreground">Address:</span>
                      <span className="font-medium">
                        {formData.street} {formData.number} {formData.bus && `(${formData.bus})`}<br />
                        {formData.postcode} {formData.city}<br />
                        {formData.country}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            {currentStep > 1 ? (
              <button 
                type="button" 
                onClick={prevStep}
                className="secondary-button flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            ) : (
              <button 
                type="button" 
                onClick={onClose}
                className="secondary-button"
              >
                Cancel
              </button>
            )}
            
            {currentStep < totalSteps ? (
              <button 
                type="button" 
                onClick={nextStep}
                className={`apple-button flex items-center gap-2 ${!isStepValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!isStepValid()}
              >
                Next
                <ArrowRight size={16} />
              </button>
            ) : (
              <button 
                type="submit"
                className="apple-button flex items-center gap-2"
              >
                <Check size={16} />
                Add Client
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientModal;
