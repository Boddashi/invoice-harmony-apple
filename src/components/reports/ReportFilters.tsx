
import React from 'react';
import { Button } from '@/components/ui/button';
import { FilterIcon, Users } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Item {
  id: string;
  title: string;
  price: number;
}

interface Client {
  id: string;
  name: string;
}

interface ReportFiltersProps {
  items: Item[];
  clients: Client[];
  selectedItems: string[];
  selectedClients: string[];
  searchItemQuery: string;
  searchClientQuery: string;
  toggleItemSelection: (itemId: string) => void;
  toggleClientSelection: (clientId: string) => void;
  setSearchItemQuery: (query: string) => void;
  setSearchClientQuery: (query: string) => void;
  clearFilters: () => void;
  formatCurrency: (amount: number) => string;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  items,
  clients,
  selectedItems,
  selectedClients,
  searchItemQuery,
  searchClientQuery,
  toggleItemSelection,
  toggleClientSelection,
  setSearchItemQuery,
  setSearchClientQuery,
  clearFilters,
  formatCurrency,
}) => {
  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchItemQuery.toLowerCase())
  );

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchClientQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Reports & Analytics</h1>
          <p className="text-muted-foreground">View and analyze your business data</p>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FilterIcon size={16} />
                Filter by Items
                {selectedItems.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary rounded-full text-xs font-medium">
                    {selectedItems.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72">
              <DropdownMenuLabel>Select Items</DropdownMenuLabel>
              <div className="px-2 py-2">
                <Input
                  placeholder="Search items..."
                  value={searchItemQuery}
                  onChange={(e) => setSearchItemQuery(e.target.value)}
                  className="mb-2"
                />
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto py-1">
                {filteredItems.length === 0 ? (
                  <div className="px-2 py-2 text-sm text-muted-foreground">No items found</div>
                ) : (
                  filteredItems.map((item) => (
                    <DropdownMenuCheckboxItem
                      key={item.id}
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => toggleItemSelection(item.id)}
                    >
                      <div className="flex flex-col">
                        <span>{item.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setSearchItemQuery('')}
                >
                  Clear Item Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Users size={16} />
                Filter by Clients
                {selectedClients.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary rounded-full text-xs font-medium">
                    {selectedClients.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72">
              <DropdownMenuLabel>Select Clients</DropdownMenuLabel>
              <div className="px-2 py-2">
                <Input
                  placeholder="Search clients..."
                  value={searchClientQuery}
                  onChange={(e) => setSearchClientQuery(e.target.value)}
                  className="mb-2"
                />
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto py-1">
                {filteredClients.length === 0 ? (
                  <div className="px-2 py-2 text-sm text-muted-foreground">No clients found</div>
                ) : (
                  filteredClients.map((client) => (
                    <DropdownMenuCheckboxItem
                      key={client.id}
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => toggleClientSelection(client.id)}
                    >
                      <span>{client.name}</span>
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setSearchClientQuery('')}
                >
                  Clear Client Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {(selectedItems.length > 0 || selectedClients.length > 0) && (
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </>
  );
};

export default ReportFilters;
