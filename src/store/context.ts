import { createContext, useContext } from 'react'
import { pantryStore, PantryStore } from './pantryStore'
import { householdStore, HouseholdStore } from './householdStore'

export interface RootStore {
  pantryStore: PantryStore
  householdStore: HouseholdStore
}

export const rootStore: RootStore = {
  pantryStore,
  householdStore,
}

householdStore.bindPantry(pantryStore)

export const StoreContext = createContext<RootStore>(rootStore)

export function useStores(): RootStore {
  return useContext(StoreContext)
}

export function usePantryStore(): PantryStore {
  return useContext(StoreContext).pantryStore
}

export function useHouseholdStore(): HouseholdStore {
  return useContext(StoreContext).householdStore
}
