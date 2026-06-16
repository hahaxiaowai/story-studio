<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useLocale } from '@/composables/useLocale'
import { useWorkspaces } from '@/modules/workspaces/useWorkspaces'

const open = defineModel<boolean>('open', { default: false })

const { t } = useLocale()
const { activeWorkspace, saveActiveWorkspaceDetails } = useWorkspaces()

const title = ref('')
const description = ref('')
const hasSubmitted = ref(false)

const trimmedTitle = computed<string>(() => title.value.trim())
const titleError = computed<string>(() => {
  if (!hasSubmitted.value || trimmedTitle.value)
    return ''

  return t('workspace.validation.nameRequired')
})

watch(open, (nextOpen) => {
  if (nextOpen)
    resetForm()
})

watch(activeWorkspace, () => {
  if (open.value)
    resetForm()
})

function resetForm(): void {
  title.value = activeWorkspace.value.title
  description.value = activeWorkspace.value.description ?? ''
  hasSubmitted.value = false
}

function saveWorkspaceDetails(): void {
  hasSubmitted.value = true

  if (!trimmedTitle.value)
    return

  saveActiveWorkspaceDetails({
    title: trimmedTitle.value,
    description: description.value.trim(),
  })

  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('workspace.details.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('workspace.details.description') }}
        </DialogDescription>
      </DialogHeader>

      <form class="flex flex-col gap-4" @submit.prevent="saveWorkspaceDetails">
        <FieldGroup>
          <Field :data-invalid="titleError ? '' : undefined">
            <FieldLabel for="workspace-details-title">
              {{ t('workspace.form.name') }}
            </FieldLabel>
            <Input
              id="workspace-details-title"
              v-model="title"
              :aria-invalid="!!titleError"
              autocomplete="off"
              :placeholder="t('workspace.form.namePlaceholder')"
            />
            <FieldError v-if="titleError">
              {{ titleError }}
            </FieldError>
          </Field>

          <Field>
            <FieldLabel for="workspace-details-description">
              {{ t('workspace.form.description') }}
            </FieldLabel>
            <Textarea
              id="workspace-details-description"
              v-model="description"
              :placeholder="t('workspace.form.descriptionPlaceholder')"
              rows="4"
            />
            <FieldDescription>
              {{ t('workspace.details.description') }}
            </FieldDescription>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">
            {{ t('workspace.form.cancel') }}
          </Button>
          <Button type="submit">
            {{ t('workspace.form.save') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
