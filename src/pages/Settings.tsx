
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import CustomCard from '../components/ui/CustomCard';
import { User, Building, CreditCard, Shield, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const Settings = () => {
  const [activeTab, setActiveTab] = React.useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <CustomCard className="overflow-hidden">
              <div className="divide-y divide-border">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "w-full p-4 flex items-center gap-3 transition-colors",
                        isActive ? "bg-apple-blue/10" : "hover:bg-secondary"
                      )}
                    >
                      <Icon size={20} className={isActive ? "text-apple-blue" : "text-muted-foreground"} />
                      <span className={isActive ? "font-medium text-apple-blue" : ""}>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </CustomCard>
          </div>
          
          {/* Content */}
          <div className="md:col-span-3 animate-fade-in">
            {activeTab === 'profile' && (
              <CustomCard>
                <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                    <input type="text" className="input-field w-full" defaultValue="John" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                    <input type="text" className="input-field w-full" defaultValue="Appleseed" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                    <input type="email" className="input-field w-full" defaultValue="john@example.com" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
                    <input type="tel" className="input-field w-full" defaultValue="(123) 456-7890" />
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="font-medium mb-3">Profile Picture</h3>
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                      <User size={32} />
                    </div>
                    
                    <div className="flex gap-3">
                      <button className="secondary-button">Upload New</button>
                      <button className="ghost-button text-apple-red">Remove</button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-border flex justify-end">
                  <button className="apple-button">Save Changes</button>
                </div>
              </CustomCard>
            )}
            
            {activeTab === 'company' && (
              <CustomCard>
                <h2 className="text-xl font-semibold mb-6">Company Details</h2>
                <p className="text-muted-foreground">Configure your company information for invoices.</p>
              </CustomCard>
            )}
            
            {activeTab === 'billing' && (
              <CustomCard>
                <h2 className="text-xl font-semibold mb-6">Billing & Subscription</h2>
                <p className="text-muted-foreground">Manage your billing information and subscription plan.</p>
              </CustomCard>
            )}
            
            {activeTab === 'security' && (
              <CustomCard>
                <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                <p className="text-muted-foreground">Update your password and configure security settings.</p>
              </CustomCard>
            )}
            
            {activeTab === 'notifications' && (
              <CustomCard>
                <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                <p className="text-muted-foreground">Customize when and how you receive notifications.</p>
              </CustomCard>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
