import React from "react";
import { Button } from "@/components/ui/button";
import { FilterIcon, Users, X, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchItemQuery.toLowerCase())
  );

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchClientQuery.toLowerCase())
  );

  const hasActiveFilters =
    selectedItems.length > 0 || selectedClients.length > 0;

  const clearItemFilters = () => {
    setSearchItemQuery("");
    selectedItems.forEach((itemId) => toggleItemSelection(itemId));
  };

  const clearClientFilters = () => {
    setSearchClientQuery("");
    selectedClients.forEach((clientId) => toggleClientSelection(clientId));
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            View and analyze your business data
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FilterIcon size={16} />
                Filter by Items
                {selectedItems.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 px-1.5 text-xs font-medium"
                  >
                    {selectedItems.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-72"
              align="end"
              side="bottom"
              sideOffset={5}
              alignOffset={0}
              avoidCollisions={true}
              collisionPadding={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
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
              <div className="h-[200px] max-h-[40vh] overflow-auto">
                <ScrollArea className="h-full">
                  <div className="py-1 px-1">
                    {filteredItems.length === 0 ? (
                      <div className="px-2 py-2 text-sm text-muted-foreground">
                        No items found
                      </div>
                    ) : (
                      filteredItems.map((item) => (
                        <DropdownMenuCheckboxItem
                          key={item.id}
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                          className="py-2"
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
                </ScrollArea>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2 sticky bottom-0 bg-popover">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-1"
                  onClick={clearItemFilters}
                >
                  <X size={14} />
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
                  <Badge
                    variant="secondary"
                    className="ml-1 px-1.5 text-xs font-medium"
                  >
                    {selectedClients.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-72"
              align="end"
              side="bottom"
              sideOffset={5}
              alignOffset={0}
              avoidCollisions={true}
              collisionPadding={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
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
              <div className="h-[200px] max-h-[40vh] overflow-auto">
                <ScrollArea className="h-full">
                  <div className="py-1 px-1">
                    {filteredClients.length === 0 ? (
                      <div className="px-2 py-2 text-sm text-muted-foreground">
                        No clients found
                      </div>
                    ) : (
                      filteredClients.map((client) => (
                        <DropdownMenuCheckboxItem
                          key={client.id}
                          checked={selectedClients.includes(client.id)}
                          onCheckedChange={() =>
                            toggleClientSelection(client.id)
                          }
                          className="py-2"
                        >
                          <span>{client.name}</span>
                        </DropdownMenuCheckboxItem>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2 sticky bottom-0 bg-popover">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-1"
                  onClick={clearClientFilters}
                >
                  <X size={14} />
                  Clear Client Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex items-center justify-between bg-secondary/30 rounded-lg p-3 animate-fade-in">
          <div className="flex flex-wrap items-center gap-2">
            {selectedItems.length > 0 && (
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground mr-2">
                  Items:
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedItems.map((itemId) => {
                    const item = items.find((i) => i.id === itemId);
                    return (
                      item && (
                        <Badge
                          key={itemId}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {item.title}
                          <button
                            onClick={() => toggleItemSelection(itemId)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X size={12} />
                          </button>
                        </Badge>
                      )
                    );
                  })}
                </div>
              </div>
            )}

            {selectedClients.length > 0 && (
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground mr-2">
                  Clients:
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedClients.map((clientId) => {
                    const client = clients.find((c) => c.id === clientId);
                    return (
                      client && (
                        <Badge
                          key={clientId}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {client.name}
                          <button
                            onClick={() => toggleClientSelection(clientId)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X size={12} />
                          </button>
                        </Badge>
                      )
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={clearFilters}
            className="whitespace-nowrap flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Reset Filters
          </Button>
        </div>
      )}
    </>
  );
};

export default ReportFilters;
