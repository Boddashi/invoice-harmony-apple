
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
    name: '',
    company: '',
    email: '',
    phone: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      name: '',
      company: '',
      email: '',
      phone: ''
    });
    
    toast({
      title: "Success",
      description: "Client added successfully.",
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border/40 rounded-xl shadow-apple-lg dark:shadow-neon-md w-full max-w-md animate-in fade-in slide-in-from-bottom-10">
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
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field w-full" 
              placeholder="John Doe" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Company</label>
            <input 
              type="text" 
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="input-field w-full" 
              placeholder="Company Inc." 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field w-full" 
              placeholder="john@example.com" 
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
              placeholder="(123) 456-7890" 
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
