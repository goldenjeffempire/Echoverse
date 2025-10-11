/**
 * LOW-010: Search Filters Component
 */
import { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/ui/popover';
export function SearchFilters({ searchQuery, onSearchChange, categories = [], selectedFilters = {}, onFilterChange, placeholder = "Search..." }) {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const activeFilterCount = Object.keys(selectedFilters).length;
    const clearAllFilters = () => {
        Object.keys(selectedFilters).forEach(key => {
            onFilterChange?.(key, null);
        });
    };
    return (<div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <Input type="search" placeholder={placeholder} value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-9 pr-9"/>
          {searchQuery && (<button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground"/>
            </button>)}
        </div>

        {categories.length > 0 && (<Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4"/>
                Filters
                {activeFilterCount > 0 && (<Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Filters</h4>
                  {activeFilterCount > 0 && (<Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Clear all
                    </Button>)}
                </div>

                {categories.map(category => (<div key={category.id} className="space-y-2">
                    <label className="text-sm font-medium">
                      {category.label}
                    </label>
                    <Select value={selectedFilters[category.id]?.toString() || ''} onValueChange={(value) => onFilterChange?.(category.id, value || null)}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${category.label.toLowerCase()}`}/>
                      </SelectTrigger>
                      <SelectContent>
                        {category.options.map(option => (<SelectItem key={option.id} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>))}
              </div>
            </PopoverContent>
          </Popover>)}
      </div>

      {activeFilterCount > 0 && (<div className="flex flex-wrap gap-2">
          {Object.entries(selectedFilters).map(([key, value]) => {
                const category = categories.find(c => c.id === key);
                const option = category?.options.find(o => o.value === value);
                return (<Badge key={key} variant="secondary" className="gap-1">
                {category?.label}: {option?.label || value}
                <button onClick={() => onFilterChange?.(key, null)} className="ml-1 hover:bg-destructive/20 rounded-full p-0.5">
                  <X className="h-3 w-3"/>
                </button>
              </Badge>);
            })}
        </div>)}
    </div>);
}
