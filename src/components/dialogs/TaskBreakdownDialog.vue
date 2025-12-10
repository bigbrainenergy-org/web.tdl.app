<template>
  <q-dialog ref="dialogRef" :maximized="$q.screen.lt.md" @hide="onDialogHide">
    <div style="display: flex; gap: 16px;">
      <q-card :style="showSidebar && searchResults.length > 0 ? 'min-width: 300px; max-width: 500px;' : 'min-width: 550px; max-width: 800px;'">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Break Down Task</div>
          <q-space />
          <q-btn v-close-popup icon="close" flat round dense />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <div class="text-subtitle1 q-mb-sm text-weight-medium">
            {{ task.title }}
          </div>

          <!-- Incomplete Prerequisites -->
          <div v-if="incompletePrereqs.length > 0" class="q-mb-md">
            <div class="text-caption text-primary q-mb-xs">Prerequisites ({{ incompletePrereqs.length }}):</div>
            <div class="text-caption text-primary">
              <div v-for="prereq in visiblePrereqs" :key="prereq.id" class="q-pl-sm">
                • {{ prereq.title }}
              </div>
              <q-btn
                v-if="incompletePrereqs.length > 3"
                flat
                dense
                no-caps
                size="sm"
                :label="showAllPrereqs ? 'Show less' : `Show ${incompletePrereqs.length - 3} more`"
                class="q-pl-sm text-primary"
                @click="showAllPrereqs = !showAllPrereqs"
              />
            </div>
          </div>

          <div class="text-caption text-grey-7 q-mb-md">
            Break this task into a list of smaller steps:
          </div>

          <ul ref="listRef" style="list-style-type: none; margin: 0; padding: 0;">
            <li v-for="(item, index) in items" :key="item.id" class="q-mb-sm" style="display: flex; align-items: center; gap: 8px;">
              <q-avatar rounded icon="fa-solid fa-grip-vertical" class="drag-handle" color="grey" size="sm" style="cursor: grab;" />
              <q-input
                ref="inputRefs"
                v-model="item.text"
                :autofocus="index === items.length - 1"
                outlined
                dense
                :placeholder="`Subtask ${index + 1}`"
                style="flex: 1; pointer-events: auto; user-select: text;"
                :class="{ 'existing-task-input': item.existingTask }"
                :debounce="50"
                @keydown.enter.prevent="onItemEnter(index)"
                @keydown.delete="(e: KeyboardEvent) => onItemDelete(index, e)"
                @keydown.down="focusNext(index)"
                @keydown.up="focusPrev(index)"
                @keydown.esc="onDialogHide"
                @focus="onInputFocus(index)"
                @blur="onInputBlur"
              >
                <template #prepend>
                  <q-icon v-if="item.existingTask" name="link" color="green" />
                </template>
                <template #append>
                  <q-icon
                    v-if="index > 0"
                    name="close"
                    class="cursor-pointer"
                    @click="removeItem(index)"
                  />
                </template>
              </q-input>
            </li>
          </ul>
        </q-card-section>

        <q-card-actions align="center" class="q-pb-md">
          <q-btn
            color="grey"
            label="No Refinement Needed"
            outline
            no-caps
            @click="markAsRefined"
          />
          <q-space />
          <q-btn
            color="primary"
            label="Submit"
            :disable="!hasValidItems"
            no-caps
            @click="submitTasks"
          />
        </q-card-actions>
      </q-card>

      <!-- Search Results Sidebar -->
      <q-card v-if="showSidebar && searchResults.length > 0" style="width: 350px; max-width: 400px; max-height: 500px; overflow-y: auto;">
        <q-card-section class="q-pa-sm">
          <div class="text-subtitle2 q-mb-sm">Existing Tasks</div>
          <q-list dense>
            <q-item
              v-for="searchResultTask in searchResults as Task[]"
              :key="searchResultTask.id"
              clickable
              @click="selectExistingTask(searchResultTask, focusedItemIndex!)"
            >
              <q-item-section>
                <q-item-label>{{ searchResultTask.title }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick, onMounted, watch } from 'vue'
  import { useDialogPluginComponent } from 'quasar'
  import type { CreateTaskOptions } from 'src/stores/tasks/task-interfaces-types'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import type { Task } from 'src/stores/tasks/task-model'
  import { useTaskNeedsRefinementStore } from 'src/stores/tasks/task-needs-refinement'
  import { recalculate } from 'src/stores/tasks/task-view'
  import { dontLookAtMe } from 'src/stores/tasks/look-i-dont-make-the-rules'
  import { useDragAndDrop } from '@formkit/drag-and-drop/vue'
  import Fuse from 'fuse.js'

  const ewww = dontLookAtMe()

  const props = defineProps<{
    task: Task
  }>()

  interface BreakdownItem {
    id: string
    text: string
    existingTask?: Task
  }

  const emit = defineEmits([...useDialogPluginComponent.emits])
  const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
  const taskStore = useTaskStore()
  const needsRefinementStore = useTaskNeedsRefinementStore()

  let itemIdCounter = 0
  const generateId = () => `breakdown-item-${itemIdCounter++}`

  const createNewItem = (text = '', existingTask?: Task): BreakdownItem => ({
    id: generateId(),
    text,
    existingTask
  })

  const initialItems = [createNewItem()]
  const [listRef, items] = useDragAndDrop<BreakdownItem>(initialItems, {
    dragHandle: '.drag-handle'
  })

  const inputRefs = ref<HTMLInputElement[]>([])
  const showSidebar = ref(false)
  const focusedItemIndex = ref<number | null>(null)
  const searchResults = ref<Task[]>([])
  const showAllPrereqs = ref(false)

  // Get incomplete prerequisites
  const incompletePrereqs = computed(() => props.task.grabPrereqs(true))
  const visiblePrereqs = computed(() =>
    showAllPrereqs.value ? incompletePrereqs.value : incompletePrereqs.value.slice(0, 3)
  )

  const hasValidItems = computed(() => {
    return items.value.some(item => item.text.trim() !== '' || item.existingTask)
  })

  // Search functionality
  const allTasks = computed(() => taskStore.incompleteOnly.value)
  const fuseOptions = {
    keys: ['title'],
    threshold: 0.3,
    includeScore: true
  }

  const searchForTasks = (query: string) => {
    if (!query.trim()) {
      searchResults.value = []
      return
    }
    const fuse = new Fuse(allTasks.value, fuseOptions)
    const results = fuse.search(query, { limit: 10 })

    // Deduplicate by task ID
    const seenIds = new Set<number>()
    const uniqueResults = results
      .map(r => r.item)
      .filter(task => {
        if (seenIds.has(task.id)) return false
        seenIds.add(task.id)
        return true
      })

    searchResults.value = uniqueResults
  }

  // Watch for text changes to update search
  const lastSearchText = ref('')
  watch(items, (newItems) => {
    if (focusedItemIndex.value !== null) {
      const item = newItems[focusedItemIndex.value]
      if (item && !item.existingTask) {
        // Only search if the text actually changed
        if (item.text !== lastSearchText.value) {
          lastSearchText.value = item.text
          searchForTasks(item.text)
          if (item.text.trim()) {
            showSidebar.value = true
          } else {
            showSidebar.value = false
          }
        }
      }
    }
  }, { deep: true })

  function selectExistingTask(task: Task, index: number) {
    items.value[index] = {
      id: items.value[index]!.id,
      text: task.title,
      existingTask: task
    }
    showSidebar.value = false
    searchResults.value = []
    focusedItemIndex.value = null
    lastSearchText.value = ''

    // Add a new blank item beneath the selected one
    items.value.splice(index + 1, 0, createNewItem())
    nextTick(() => {
      focusInput(index + 1)
    })
  }

  function onInputFocus(index: number) {
    focusedItemIndex.value = index
    const item = items.value[index]
    if (item && !item.existingTask && item.text.trim()) {
      lastSearchText.value = item.text
      showSidebar.value = true
      searchForTasks(item.text)
    } else {
      lastSearchText.value = ''
    }
  }

  function onInputBlur() {
    // Delay hiding sidebar to allow clicking on search results
    setTimeout(() => {
      showSidebar.value = false
      focusedItemIndex.value = null
    }, 200)
  }

  function onItemEnter(index: number) {
    const item = items.value[index]
    const currentValue = item?.text.trim() || ''

    if (currentValue || item?.existingTask) {
      // Insert new item directly below the current item
      const newIndex = index + 1
      items.value.splice(newIndex, 0, createNewItem())

      // Double nextTick to ensure refs are fully updated
      nextTick(() => {
        nextTick(() => {
          if (inputRefs.value && inputRefs.value[newIndex]) {
            inputRefs.value[newIndex].focus()
          }
        })
      })
    }
  }

  function onItemDelete(index: number, event: KeyboardEvent) {
    const item = items.value[index]
    const currentValue = item?.text || ''

    if (currentValue === '' && !item?.existingTask && index > 0) {
      // If empty and not the first item, remove it
      event.preventDefault() // Prevent default backspace behavior
      removeItem(index)
    }
  }

  function removeItem(index: number) {
    if (items.value.length > 1) {
      items.value.splice(index, 1)

      // Focus previous input after removal
      if (index > 0) {
        nextTick(() => {
          focusInput(Math.max(0, index - 1))
        })
      }
    }
  }

  function focusInput(index: number) {
    if (inputRefs.value && inputRefs.value[index]) {
      inputRefs.value[index].focus()
    }
  }

  function focusNext(index: number) {
    if (index < items.value.length - 1) {
      nextTick(() => {
        focusInput(index + 1)
      })
    }
  }

  function focusPrev(index: number) {
    if (index > 0) {
      nextTick(() => {
        focusInput(index - 1)
      })
    }
  }

  function markAsRefined() {
    // Just remove the needs refinement flag without creating subtasks
    needsRefinementStore.unmarkNeedsRefinement(props.task.id)
    onDialogOK()
  }

  async function submitTasks() {
    if (!hasValidItems.value) return

    const taskIds: number[] = []

    // Phase 1: Create new subtasks and collect existing task IDs
    for (const item of items.value) {
      if (item.existingTask) {
        // Use existing task
        taskIds.push(item.existingTask.id)
      } else {
        const trimmedText = item.text.trim()
        if (!trimmedText) continue

        const taskOptions: CreateTaskOptions = {
          title: trimmedText,
          hard_prereq_ids: [],
          hard_postreq_ids: []
        }

        try {
          const createdTask = await taskStore.apiCreate(taskOptions, { skipRecalculate: true })
          if (createdTask) {
            taskIds.push(createdTask.id)
          }
        } catch (error) {
          console.error('Error creating task:', error)
        }
      }
    }

    // Phase 2: Add rules between subtasks with batch operations deferred
    for (let i = 1; i < taskIds.length; i++) {
      const prevTaskId = taskIds[i - 1]!
      const currentTaskId = taskIds[i]!
      try {
        await taskStore.addRule(prevTaskId, currentTaskId, {
          skipRecalculate: true,
          skipBatchOperations: true
        })
      } catch (error) {
        console.error('Error adding rule:', error)
      }
    }

    // Phase 3: Link last subtask to parent task with batch operations deferred
    const lastTaskId = taskIds[taskIds.length - 1]
    if (lastTaskId !== undefined) {
      try {
        await taskStore.addRule(lastTaskId, props.task.id, {
          skipRecalculate: true,
          skipBatchOperations: true
        })
      } catch (error) {
        console.error('Error linking to parent task:', error)
      }
    }

    // Phase 4: Single batch update of task objects (including parent task)
    const allAffectedTaskIds = [...taskIds, props.task.id]
    taskStore.$patch(() => {
      for (const taskId of allAffectedTaskIds) {
        const task = taskStore.hardGet(taskId)
        const pres = ewww.grabPres(taskId)
        const posts = ewww.grabPosts(taskId)
        task.hard_prereq_ids = Array.from(pres.keys())
        task.hard_postreq_ids = Array.from(posts.keys())
      }
    })

    // Phase 5: Single cache refresh
    taskStore.refreshStarredCache()

    // Phase 6: Single recalculation
    recalculate('TaskBreakdownDialog batch complete')

    // Remove needs refinement flag from the parent task
    needsRefinementStore.unmarkNeedsRefinement(props.task.id)

    onDialogOK()
  }

  // Focus first input when dialog opens
  onMounted(() => {
    focusInput(0)
  })
</script>

<style scoped>
.existing-task-input :deep(.q-field__control) {
  border: 4px solid darkgreen !important;
}

.drag-handle {
  flex-shrink: 0;
}

.drag-handle:active {
  cursor: grabbing;
}
</style>
