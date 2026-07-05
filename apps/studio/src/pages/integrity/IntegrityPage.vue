<script setup lang="ts">
import { AlertTriangleIcon, CheckCircle2Icon, CircleAlertIcon } from '@lucide/vue'
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useWorkspaceIntegrity } from '@/modules/integrity/useWorkspaceIntegrity'

const { t } = useLocale()
const { report } = useWorkspaceIntegrity()
const issueIcon = computed(() => report.value.passed ? CheckCircle2Icon : AlertTriangleIcon)
</script>

<template>
  <section class="border-border/70 bg-background min-h-[calc(100svh-12rem)] rounded-lg border shadow-sm">
    <div class="border-border/70 flex flex-col gap-4 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-muted-foreground text-xs font-medium uppercase">
          {{ t('integrity.eyebrow') }}
        </p>
        <h1 class="mt-2 text-2xl font-semibold tracking-normal md:text-4xl">
          {{ t('integrity.title') }}
        </h1>
      </div>
      <div class="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
        <component :is="issueIcon" class="size-4" :class="report.passed ? 'text-emerald-600' : 'text-amber-600'" />
        <span>{{ report.passed ? t('integrity.passed') : t('integrity.failed') }}</span>
      </div>
    </div>

    <div class="grid gap-4 p-5 md:grid-cols-3">
      <article class="bg-muted/50 border-border/70 rounded-lg border p-4">
        <p class="text-muted-foreground text-sm">
          {{ t('integrity.issueCount') }}
        </p>
        <p class="mt-3 text-2xl font-semibold">
          {{ report.issueCount }}
        </p>
      </article>
      <article class="bg-muted/50 border-border/70 rounded-lg border p-4">
        <p class="text-muted-foreground text-sm">
          {{ t('integrity.errorCount') }}
        </p>
        <p class="mt-3 text-2xl font-semibold">
          {{ report.errorCount }}
        </p>
      </article>
      <article class="bg-muted/50 border-border/70 rounded-lg border p-4">
        <p class="text-muted-foreground text-sm">
          {{ t('integrity.warningCount') }}
        </p>
        <p class="mt-3 text-2xl font-semibold">
          {{ report.warningCount }}
        </p>
      </article>
    </div>

    <div class="px-5 pb-5">
      <div v-if="report.passed" class="text-muted-foreground grid min-h-64 place-items-center rounded-lg border border-dashed text-sm">
        {{ t('integrity.empty') }}
      </div>
      <div v-else class="grid gap-3">
        <article
          v-for="issue in report.issues"
          :key="issue.id"
          class="border-border/70 rounded-lg border p-4"
        >
          <div class="flex items-start gap-3">
            <CircleAlertIcon class="mt-0.5 size-4 shrink-0" :class="issue.severity === 'error' ? 'text-destructive' : 'text-amber-600'" />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-sm font-semibold">
                  {{ issue.title }}
                </h2>
                <span class="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs">
                  {{ issue.severity === 'error' ? t('integrity.error') : t('integrity.warning') }}
                </span>
              </div>
              <p class="text-muted-foreground mt-2 text-sm">
                {{ issue.description }}
              </p>
              <p class="text-muted-foreground mt-3 text-xs">
                {{ t('integrity.source') }}：{{ issue.sourceLabel }}
              </p>
              <a
                class="text-primary mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline"
                :href="issue.targetHash"
              >
                {{ t('integrity.resolve') }}
              </a>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
