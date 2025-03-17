
import React from "react";
import CustomCard from "../ui/CustomCard";

const ProfileTab = () => {
  return (
    <CustomCard>
      <h2 className="text-xl font-semibold mb-6">
        Personal Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            First Name
          </label>
          <input
            type="text"
            className="input-field w-full"
            defaultValue="John"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Last Name
          </label>
          <input
            type="text"
            className="input-field w-full"
            defaultValue="Appleseed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Email Address
          </label>
          <input
            type="email"
            className="input-field w-full"
            defaultValue="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            className="input-field w-full"
            defaultValue="(123) 456-7890"
          />
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border flex justify-end">
        <button className="apple-button">Save Changes</button>
      </div>
    </CustomCard>
  );
};

export default ProfileTab;
