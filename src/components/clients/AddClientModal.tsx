
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (client: any) => void;
}

const AddClientModal = ({ isOpen, onClose, onAddClient }: AddClientModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    type: 'business', // Default to business type
    name: '',
    company: '',
    email: '',
    phone: '',
    street: '',
    number: '',
    bus: '',
    postcode: '',
    city: '',
    country: 'Belgium', // Default country
    vatNumber: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({ ...prev, type }));
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
    
    toast({
      title: "Success",
      description: "Client added successfully.",
    });
    
    onClose();
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
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Client Type Selection */}
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
          
          {/* VAT Number Search Field - Just UI, not functional */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Search by name or VAT number</label>
            <div className="flex">
              <div className="input-field-group flex">
                <div className="bg-secondary/70 flex items-center justify-center px-3 border-r border-border/40 rounded-l-lg">
                  <span className="text-sm font-medium">BE</span>
                </div>
                <input 
                  type="text" 
                  className="input-field rounded-l-none" 
                  placeholder="Search by name or VAT number" 
                />
              </div>
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
          
          {/* Address Fields */}
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
              {/* Add more countries as needed */}
            </select>
          </div>
          
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
          
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="secondary-button"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="apple-button"
            >
              Add Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientModal;
