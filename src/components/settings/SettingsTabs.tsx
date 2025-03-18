import React from "react";
import { cn } from "@/lib/utils";
import { TabItem } from "@/models/SettingsModels";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomCard from "@/components/ui/CustomCard";

interface SettingsTabsProps {
  tabs: TabItem[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  orientation: "horizontal" | "vertical";
}

const SettingsTabs = ({
  tabs,
  activeTab,
  setActiveTab,
  orientation,
}: SettingsTabsProps) => {
  // For horizontal tabs layout (small screens)
  if (orientation === "horizontal") {
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-center">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    );
  }

  // For vertical tabs layout (larger screens)
  return (
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
                isActive
                  ? "bg-apple-blue/10 dark:bg-apple-purple/10"
                  : "hover:bg-secondary"
              )}
            >
              <Icon
                size={20}
                className={
                  isActive
                    ? "text-apple-blue dark:text-apple-purple"
                    : "text-muted-foreground"
                }
              />
              <span
                className={
                  isActive
                    ? "font-medium text-apple-blue text-left dark:text-apple-purple"
                    : "text-left"
                }
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </CustomCard>
  );
};

export default SettingsTabs;
