import type { EntityKind, PropertyDefinition, PropertyValueType } from '@story-studio/types'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { useStudioData } from '../storage/useStudioData'
import {
  createCustomProperty,
  getPropertiesByKind,
  moveProperty,
  removeCustomProperty,
  replacePropertiesByKind,
  updateProperty,
} from './properties'

export interface AddPropertyInput {
  name: string
  valueType: PropertyValueType
}

export function useProperties(kind: EntityKind): {
  properties: ComputedRef<PropertyDefinition[]>
  addProperty: (input: AddPropertyInput) => void
  updatePropertyById: (propertyId: string, patch: Partial<Omit<PropertyDefinition, 'id' | 'kind' | 'system'>>) => void
  movePropertyById: (propertyId: string, direction: 'up' | 'down') => void
  removePropertyById: (propertyId: string) => void
  saveProperties: (nextProperties: PropertyDefinition[]) => void
} {
  const studioData = useStudioData()
  const properties = computed<PropertyDefinition[]>(() => getPropertiesByKind(studioData.document.value.propertyDefinitions, kind))

  function addProperty(input: AddPropertyInput): void {
    studioData.updateDocument((document) => {
      document.propertyDefinitions = [
        ...document.propertyDefinitions,
        createCustomProperty(document.propertyDefinitions, { kind, ...input }),
      ]
    })
  }

  function updatePropertyById(propertyId: string, patch: Partial<Omit<PropertyDefinition, 'id' | 'kind' | 'system'>>): void {
    studioData.updateDocument((document) => {
      document.propertyDefinitions = updateProperty(document.propertyDefinitions, propertyId, patch)
    })
  }

  function movePropertyById(propertyId: string, direction: 'up' | 'down'): void {
    studioData.updateDocument((document) => {
      document.propertyDefinitions = moveProperty(document.propertyDefinitions, propertyId, direction)
    })
  }

  function removePropertyById(propertyId: string): void {
    studioData.updateDocument((document) => {
      document.propertyDefinitions = removeCustomProperty(document.propertyDefinitions, propertyId)
    })
  }

  function saveProperties(nextProperties: PropertyDefinition[]): void {
    studioData.updateDocument((document) => {
      document.propertyDefinitions = replacePropertiesByKind(document.propertyDefinitions, kind, nextProperties)
    })
  }

  return {
    properties,
    addProperty,
    updatePropertyById,
    movePropertyById,
    removePropertyById,
    saveProperties,
  }
}
