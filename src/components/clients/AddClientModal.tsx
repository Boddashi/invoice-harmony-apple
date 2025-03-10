
import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (client: any) => void;
}

const AddClientModal = ({ isOpen, onClose, onAddClient }: AddClientModalProps) => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    type: 'business',
    name: '',
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add New Client</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          {/* Client Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Client Type</Label>
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
          
          {/* Contact Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">Contact Information</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                <Input 
                  id="name"
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Client name" 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                <Input 
                  id="email"
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="client@example.com" 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                <Input 
                  id="phone"
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+32 123 456 789" 
                />
              </div>
            </div>
          </div>
          
          {/* Address Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">Address</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="street" className="text-sm font-medium">Street</Label>
                <Input 
                  id="street"
                  type="text" 
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="Street name" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="number" className="text-sm font-medium">Number</Label>
                  <Input 
                    id="number"
                    type="text" 
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    placeholder="123" 
                  />
                </div>
                <div>
                  <Label htmlFor="bus" className="text-sm font-medium">Bus</Label>
                  <Input 
                    id="bus"
                    type="text" 
                    name="bus"
                    value={formData.bus}
                    onChange={handleChange}
                    placeholder="A" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postcode" className="text-sm font-medium">Postcode</Label>
                  <Input 
                    id="postcode"
                    type="text" 
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleChange}
                    placeholder="1000" 
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="text-sm font-medium">City</Label>
                  <Input 
                    id="city"
                    type="text" 
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Brussels" 
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                <select 
                  id="country"
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
          </div>
          
          {/* Additional Info Section */}
          {formData.type === 'business' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">Business Details</h3>
              
              <div>
                <Label htmlFor="vatNumber" className="text-sm font-medium">VAT Number</Label>
                <Input 
                  id="vatNumber"
                  type="text" 
                  name="vatNumber"
                  value={formData.vatNumber}
                  onChange={handleChange}
                  placeholder="BE0123456789" 
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            
            <button 
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Check size={16} />
              Add Client
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientModal;
