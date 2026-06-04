import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { setFilter, clearFilters } from "@/features/alerts/slices/filtersSlice";
import { AlertFilters } from "@/features/alerts/types";

// wraps useSelector + useDispatch so components don't touch Redux directly
// components just call useAlertFilters() and get filters + setters back
export function useAlertFilters() {
  const dispatch = useDispatch();
  const filters = useSelector((state: RootState) => state.filters);

  const updateFilter = (update: Partial<AlertFilters>) => {
    dispatch(setFilter(update));
  };

  const resetFilters = () => {
    dispatch(clearFilters());
  };

  return { filters, updateFilter, resetFilters };
}