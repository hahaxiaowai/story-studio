<script setup lang="ts">
import type { StoryProject } from '@story-studio/types'
import { createSlug } from '@story-studio/utils'
import { computed } from 'vue'

const sampleProject: StoryProject = {
  id: 'project-seed',
  title: 'Story Studio',
  createdAt: '2026-05-17T00:00:00.000Z',
  updatedAt: '2026-05-17T00:00:00.000Z',
}

const projectSlug = computed<string>(() => createSlug(sampleProject.title))
</script>

<template>
  <main class="studio-shell" aria-label="Story Studio workspace">
    <aside class="studio-sidebar" aria-label="Workspace navigation">
      <div class="brand-mark" aria-hidden="true">
        SS
      </div>
      <nav class="nav-list" aria-label="Primary">
        <a class="nav-item is-active" href="#project">Project</a>
        <a class="nav-item" href="#outline">Outline</a>
        <a class="nav-item" href="#chapters">Chapters</a>
        <a class="nav-item" href="#cast">Cast</a>
      </nav>
    </aside>

    <section id="project" class="workspace-panel">
      <header class="workspace-header">
        <p class="eyebrow">
          {{ projectSlug }}
        </p>
        <h1>{{ sampleProject.title }}</h1>
      </header>

      <div class="workspace-grid" aria-label="Project overview">
        <article class="focus-pane">
          <h2>Manuscript</h2>
          <div class="writing-surface" aria-label="Draft surface">
            <p>Chapter One</p>
            <p class="draft-line" />
            <p class="draft-line short" />
            <p class="draft-line" />
          </div>
        </article>

        <aside class="inspector-pane" aria-label="Project inspector">
          <h2>Structure</h2>
          <dl>
            <div>
              <dt>Status</dt>
              <dd>Draft</dd>
            </div>
            <div>
              <dt>Chapters</dt>
              <dd>0</dd>
            </div>
            <div>
              <dt>Characters</dt>
              <dd>0</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  </main>
</template>
