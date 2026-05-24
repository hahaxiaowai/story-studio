<script setup lang="ts">
import { createSlug } from '@story-studio/utils'
import { computed } from 'vue'
import { sampleProject } from '../constants/project'

const projectSlug = computed<string>(() => createSlug(sampleProject.title))
</script>

<template>
  <main id="project" class="flex flex-1 flex-col gap-4 p-4 pt-0" aria-label="Story Studio workspace">
    <section class="grid gap-4 pt-4 md:grid-cols-3" aria-label="Project overview">
      <article class="bg-muted/50 border-border/70 rounded-lg border p-4">
        <p class="text-muted-foreground text-sm">
          Status
        </p>
        <p class="mt-3 text-2xl font-semibold">
          Draft
        </p>
      </article>
      <article class="bg-muted/50 border-border/70 rounded-lg border p-4">
        <p class="text-muted-foreground text-sm">
          Chapters
        </p>
        <p class="mt-3 text-2xl font-semibold">
          0
        </p>
      </article>
      <article class="bg-muted/50 border-border/70 rounded-lg border p-4">
        <p class="text-muted-foreground text-sm">
          Characters
        </p>
        <p class="mt-3 text-2xl font-semibold">
          0
        </p>
      </article>
    </section>

    <section class="border-border/70 bg-background min-h-[calc(100svh-12rem)] rounded-lg border shadow-sm">
      <div class="border-border/70 border-b px-5 py-4">
        <p class="text-muted-foreground text-xs font-medium uppercase">
          {{ projectSlug }}
        </p>
        <h1 class="mt-2 text-3xl font-semibold tracking-normal md:text-5xl">
          {{ sampleProject.title }}
        </h1>
      </div>

      <div class="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article id="manuscript" class="border-border/70 rounded-lg border p-5">
          <h2 class="text-lg font-semibold">
            Manuscript
          </h2>
          <div class="mt-4 min-h-80 rounded-lg border bg-[linear-gradient(180deg,#fffdf8,#f8f0e0)] p-6 text-stone-900" aria-label="Draft surface">
            <p class="font-serif text-2xl">
              Chapter One
            </p>
            <div class="mt-8 space-y-4">
              <p class="bg-muted h-3 rounded-full" />
              <p class="bg-muted h-3 w-2/3 rounded-full" />
              <p class="bg-muted h-3 rounded-full" />
            </div>
          </div>
        </article>

        <aside id="structure" class="border-border/70 rounded-lg border p-5" aria-label="Project inspector">
          <h2 class="text-lg font-semibold">
            Structure
          </h2>
          <dl class="mt-4 grid gap-3">
            <div class="flex items-center justify-between border-b pb-3">
              <dt class="text-muted-foreground">
                Outline
              </dt>
              <dd class="font-medium">
                Empty
              </dd>
            </div>
            <div class="flex items-center justify-between border-b pb-3">
              <dt class="text-muted-foreground">
                Cast
              </dt>
              <dd class="font-medium">
                Empty
              </dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-muted-foreground">
                Sync
              </dt>
              <dd class="font-medium">
                Local
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  </main>
</template>
