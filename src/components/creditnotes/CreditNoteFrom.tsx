
import React from "react";
import CustomCard from "../ui/CustomCard";

interface CreditNoteFromProps {
  userEmail: string | undefined;
}

const CreditNoteFrom: React.FC<CreditNoteFromProps> = ({ userEmail }) => {
  return (
    <CustomCard>
      <h3 className="text-lg font-medium mb-4">From</h3>
      <div className="space-y-3">
        <p>Your company information will be used here.</p>
        <p className="text-sm text-muted-foreground">
          You can update your company details in the settings.
        </p>
        {userEmail && (
          <p className="text-sm text-muted-foreground">
            Logged in as: {userEmail}
          </p>
        )}
      </div>
    </CustomCard>
  );
};

export default CreditNoteFrom;
