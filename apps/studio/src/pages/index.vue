<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useWorkspaces } from '@/modules/workspaces/useWorkspaces'

const { t } = useLocale()
const { activeWorkspace } = useWorkspaces()
const workspaceSlug = computed<string>(() => activeWorkspace.value.id.replace(/^workspace-/, ''))
</script>

<template>
  <main id="project" class="flex flex-1 flex-col gap-4 p-4 pt-0" :aria-label="t('project.aria.workspace')">
    <section class="grid gap-4 pt-4 sm:grid-cols-2 xl:grid-cols-4" :aria-label="t('project.aria.overview')">
      <article class="bg-muted/50 border-border/70 rounded-lg border p-4">
        <p class="text-muted-foreground text-sm">
          {{ t('project.outline') }}
        </p>
        <p class="mt-3 text-2xl font-semibold">
          {{ activeWorkspace.moduleCounts.outline }}
        </p>
      </article>
      <article class="bg-muted/50 border-border/70 rounded-lg border p-4">
        <p class="text-muted-foreground text-sm">
          {{ t('project.cast') }}
        </p>
        <p class="mt-3 text-2xl font-semibold">
          {{ activeWorkspace.moduleCounts.characters }}
        </p>
      </article>
      <article class="bg-muted/50 border-border/70 rounded-lg border p-4">
        <p class="text-muted-foreground text-sm">
          {{ t('project.maps') }}
        </p>
        <p class="mt-3 text-2xl font-semibold">
          {{ activeWorkspace.moduleCounts.maps }}
        </p>
      </article>
      <article class="bg-muted/50 border-border/70 rounded-lg border p-4">
        <p class="text-muted-foreground text-sm">
          {{ t('project.content') }}
        </p>
        <p class="mt-3 text-2xl font-semibold">
          {{ activeWorkspace.moduleCounts.content }}
        </p>
      </article>
    </section>

    <section class="border-border/70 bg-background min-h-[calc(100svh-12rem)] rounded-lg border shadow-sm">
      <div class="border-border/70 border-b px-5 py-4">
        <p class="text-muted-foreground text-xs font-medium uppercase">
          {{ workspaceSlug }}
        </p>
        <h1 class="mt-2 text-3xl font-semibold tracking-normal md:text-5xl">
          {{ activeWorkspace.title }}
        </h1>
      </div>

      <div class="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article id="manuscript" class="border-border/70 rounded-lg border p-5">
          <h2 class="text-lg font-semibold">
            {{ t('project.manuscript') }}
          </h2>
          <div class="mt-4 min-h-80 rounded-lg border bg-[linear-gradient(180deg,#fffdf8,#f8f0e0)] p-6 text-stone-900" :aria-label="t('project.aria.draftSurface')">
            <p class="font-serif text-2xl">
              {{ t('project.chapterOne') }}
            </p>
            <div class="mt-8 space-y-4">
              <p class="bg-muted h-3 rounded-full" />
              <p class="bg-muted h-3 w-2/3 rounded-full" />
              <p class="bg-muted h-3 rounded-full" />
            </div>
          </div>
        </article>

        <aside id="structure" class="border-border/70 rounded-lg border p-5" :aria-label="t('project.aria.inspector')">
          <h2 class="text-lg font-semibold">
            {{ t('nav.group.workspace') }}
          </h2>
          <dl class="mt-4 grid gap-3">
            <div id="outline" class="flex items-center justify-between border-b pb-3">
              <dt class="text-muted-foreground">
                {{ t('project.outline') }}
              </dt>
              <dd class="font-medium">
                {{ activeWorkspace.moduleCounts.outline }}
              </dd>
            </div>
            <div id="cast" class="flex items-center justify-between border-b pb-3">
              <dt class="text-muted-foreground">
                {{ t('project.cast') }}
              </dt>
              <dd class="font-medium">
                {{ activeWorkspace.moduleCounts.characters }}
              </dd>
            </div>
            <div id="maps" class="flex items-center justify-between border-b pb-3">
              <dt class="text-muted-foreground">
                {{ t('project.maps') }}
              </dt>
              <dd class="font-medium">
                {{ activeWorkspace.moduleCounts.maps }}
              </dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-muted-foreground">
                {{ t('project.sync') }}
              </dt>
              <dd class="font-medium">
                {{ t('project.local') }}
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      <div class="grid gap-4 p-5 pt-0 lg:grid-cols-2">
        <section id="materials" class="border-border/70 rounded-lg border p-5">
          <h2 class="text-lg font-semibold">
            {{ t('nav.materials') }}
          </h2>
          <p class="text-muted-foreground mt-3 text-sm">
            {{ t('project.empty') }}
          </p>
        </section>

        <section id="assistant" class="border-border/70 rounded-lg border p-5">
          <h2 class="text-lg font-semibold">
            {{ t('nav.assistant') }}
          </h2>
          <p class="text-muted-foreground mt-3 text-sm">
            {{ t('assistant.prompts') }}
          </p>
        </section>
      </div>
    </section>
  </main>
</template>
