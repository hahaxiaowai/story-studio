export interface StoryProject {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface StoryChapter {
  id: string
  projectId: string
  title: string
  order: number
}

export interface StoryCharacter {
  id: string
  projectId: string
  name: string
  role?: string
}
