"use client"
import PropTypes from 'prop-types';
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Search, Filter, Download, UserPlus, Calendar } from "lucide-react"

UsersFilters.propTypes = {
  filters: PropTypes.shape({
    search: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    dateRange: PropTypes.string.isRequired,
    minSpent: PropTypes.string.isRequired,
    maxSpent: PropTypes.string.isRequired,
    dateFrom: PropTypes.string,
    dateTo: PropTypes.string,
  }).isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onExport: PropTypes.func,
};

export function UsersFilters({ filters, onFiltersChange, onExport }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => onExport && onExport()}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          {/* <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add User
          </Button> */}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value })}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Min spent"
            type="number"
            value={filters.minSpent}
            onChange={(e) => onFiltersChange({ ...filters, minSpent: e.target.value })}
            className="w-32"
          />
          <span className="text-gray-500">to</span>
          <Input
            placeholder="Max spent"
            type="number"
            value={filters.maxSpent}
            onChange={(e) => onFiltersChange({ ...filters, maxSpent: e.target.value })}
            className="w-32"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
              className="w-44"
            />
            <span className="text-gray-500">to</span>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
              className="w-44"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
