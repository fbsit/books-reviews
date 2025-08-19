import { defineStore } from 'pinia'

type SidebarName = 'none' | 'user' | 'filters'

interface UiState {
  activeSidebar: SidebarName
}

export const useUiStore = defineStore('ui', {
  state: (): UiState => ({ activeSidebar: 'none' }),
  actions: {
    openSidebar(name: Exclude<SidebarName, 'none'>) {
      this.activeSidebar = name
      if (process.client) {
        try { document.body.classList.add('no-scroll') } catch {}
      }
    },
    closeSidebar() {
      this.activeSidebar = 'none'
      if (process.client) {
        try { document.body.classList.remove('no-scroll') } catch {}
      }
    }
  }
})


